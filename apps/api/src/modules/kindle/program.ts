import * as NodeFs from 'node:fs'
import { DateTime, Duration, Effect, Layer, Option, Ref, Result } from 'effect'
import { CommandRejectedError, type KindleSDK } from '@bbbook/kindle-sdk'
import type { DeviceInfo } from '@bbbook/kindle-sdk'
import { KindleSnapshotPendingError, KindleUnavailableError } from '../../shared/schema/errors.js'
import { KINDLE_SYNC_INTERVAL_MS } from '../../config.js'
import { KindleSDKService } from './sdk.js'
import { KindleDeviceInfoService, KindleLibraryService } from './service.js'
import { InvalidRequestError } from '../auth/errors.js'

const CACHE_TTL_MS = 30 * 1000

const ALLOWED_EXTENSIONS = ['azw', 'azw3', 'mobi', 'epub', 'pdf']

type Snapshot = {
  readonly info: DeviceInfo
  readonly updatedAt: number
}

type State = {
  readonly snapshot: Option.Option<Snapshot>
  readonly lastError: Option.Option<KindleUnavailableError>
}

export const validateFileName = (fileName: string): InvalidRequestError | undefined => {
  if (!fileName || fileName.trim() === '' || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    return new InvalidRequestError({ message: 'invalid file name' })
  }
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return new InvalidRequestError({ message: 'unsupported file type' })
  }
  return undefined
}

const mapKindleError = (cause: unknown): KindleUnavailableError | InvalidRequestError => {
  if (cause instanceof CommandRejectedError) {
    return new InvalidRequestError({ message: cause.reason })
  }
  return new KindleUnavailableError({ message: String(cause), cause })
}

const makeDeviceInfoService = (sdk: KindleSDK) =>
  Effect.gen(function* () {
    const stateRef = yield* Ref.make<State>({
      snapshot: Option.none(),
      lastError: Option.none(),
    })

    const fetchSnapshot = Effect.fn('KindleDeviceInfoService.fetchSnapshot')(function* () {
      const infoResult = yield* Effect.result(
        Effect.tryPromise({
          try: () => sdk.getDeviceInfo(),
          catch: (cause) => new KindleUnavailableError({ message: String(cause), cause }),
        })
      )
      if (Result.isFailure(infoResult)) {
        const error = infoResult.failure
        yield* Ref.update(stateRef, (state) => ({ ...state, lastError: Option.some(error) }))
        return yield* error
      }

      const now = yield* DateTime.now
      const updatedAt = DateTime.toEpochMillis(now)
      yield* Ref.set(stateRef, {
        snapshot: Option.some({ info: infoResult.success, updatedAt }),
        lastError: Option.none(),
      })
      return infoResult.success
    })

    const [cachedRefresh, invalidate] = yield* Effect.cachedInvalidateWithTTL(
      fetchSnapshot(),
      Duration.millis(CACHE_TTL_MS)
    )

    const getDeviceInfo = Effect.fn('KindleDeviceInfoService.getDeviceInfo')(function* () {
      const state = yield* Ref.get(stateRef)
      if (Option.isNone(state.snapshot)) {
        if (Option.isSome(state.lastError)) {
          return yield* Effect.fail(state.lastError.value)
        }
        return yield* new KindleSnapshotPendingError({
          message: 'No Kindle snapshot available',
        })
      }

      const now = yield* DateTime.now
      const nowMs = DateTime.toEpochMillis(now)
      const { info, updatedAt } = state.snapshot.value
      const stale = Option.isSome(state.lastError) || nowMs - updatedAt > CACHE_TTL_MS
      return { info, stale }
    })

    const refresh = Effect.fn('KindleDeviceInfoService.refresh')(function* () {
      yield* invalidate
      return yield* cachedRefresh
    })

    const invalidateCache = Effect.fn('KindleDeviceInfoService.invalidateCache')(function* () {
      yield* invalidate
    })

    if (KINDLE_SYNC_INTERVAL_MS > 0) {
      const syncEffect = Effect.catch(cachedRefresh, (error) =>
        Effect.logError('Kindle background sync failed', error)
      )
      yield* Effect.forkScoped(
        Effect.forever(
          syncEffect.pipe(Effect.andThen(Effect.sleep(Duration.millis(KINDLE_SYNC_INTERVAL_MS))))
        )
      )
    }

    return KindleDeviceInfoService.of({
      getDeviceInfo,
      refresh,
      invalidateCache,
    })
  })

const cleanupTemp = (path: string) =>
  Effect.try(() => {
    if (NodeFs.existsSync(path)) {
      NodeFs.unlinkSync(path)
    }
  }).pipe(Effect.catch(() => Effect.void))

const makeLibraryService = (sdk: KindleSDK) =>
  Effect.gen(function* () {
    const listBooks = Effect.fn('KindleLibraryService.listBooks')(function* () {
      return yield* Effect.tryPromise({
        try: () => sdk.listBooks(),
        catch: (cause) => new KindleUnavailableError({ message: String(cause), cause }),
      })
    })

    const addBook = (localPath: string, fileName: string) =>
      Effect.gen(function* () {
        const validationError = validateFileName(fileName)
        if (validationError) {
          return yield* validationError
        }
        return yield* Effect.tryPromise({
          try: () => sdk.addBook(localPath, fileName),
          catch: mapKindleError,
        })
      }).pipe(Effect.ensuring(cleanupTemp(localPath)))

    const removeBook = (fileName: string) =>
      Effect.gen(function* () {
        const validationError = validateFileName(fileName)
        if (validationError) {
          return yield* validationError
        }
        return yield* Effect.tryPromise({
          try: () => sdk.removeBook(fileName),
          catch: mapKindleError,
        })
      })

    const restoreBook = (fileName: string) =>
      Effect.gen(function* () {
        const validationError = validateFileName(fileName)
        if (validationError) {
          return yield* validationError
        }
        return yield* Effect.tryPromise({
          try: () => sdk.restoreBook(fileName),
          catch: mapKindleError,
        })
      })

    const refreshLibrary = Effect.fn('KindleLibraryService.refreshLibrary')(function* () {
      return yield* Effect.tryPromise({
        try: () => sdk.refreshLibrary(),
        catch: (cause) => new KindleUnavailableError({ message: String(cause), cause }),
      })
    })

    const openBook = (fileName: string) =>
      Effect.gen(function* () {
        const validationError = validateFileName(fileName)
        if (validationError) {
          return yield* validationError
        }
        return yield* Effect.tryPromise({
          try: () => sdk.openBook(fileName),
          catch: mapKindleError,
        })
      })

    return KindleLibraryService.of({ listBooks, addBook, removeBook, restoreBook, refreshLibrary, openBook })
  })

const DeviceInfoLive = Layer.effect(
  KindleDeviceInfoService,
  Effect.gen(function* () {
    const { client: sdk } = yield* KindleSDKService
    return yield* makeDeviceInfoService(sdk)
  })
).pipe(Layer.provide(KindleSDKService.Live))

const LibraryLive = Layer.effect(
  KindleLibraryService,
  Effect.gen(function* () {
    const { client: sdk } = yield* KindleSDKService
    return yield* makeLibraryService(sdk)
  })
).pipe(Layer.provide(KindleSDKService.Live))

export const Live = Layer.mergeAll(DeviceInfoLive, LibraryLive)
