import { DateTime, Duration, Effect, Layer, Option, Ref, Result } from 'effect'
import type { DeviceInfo, KindleSDK } from '@bbbook/kindle-sdk'
import { KindleUnavailableError } from '../../shared/schema/errors.js'
import { KINDLE_SYNC_INTERVAL_MS } from '../../config.js'
import { KindleSDKService } from './sdk.js'
import { KindleDeviceInfoService } from './service.js'

const CACHE_TTL_MS = 30 * 1000

type Snapshot = {
  readonly info: DeviceInfo
  readonly updatedAt: number
}

type State = {
  readonly snapshot: Option.Option<Snapshot>
  readonly lastError: Option.Option<KindleUnavailableError>
}

const makeDeviceInfoService = (sdk: KindleSDK) =>
  Effect.gen(function* () {
    const stateRef = yield* Ref.make<State>({
      snapshot: Option.none(),
      lastError: Option.none(),
    })

    const fetchSnapshot = Effect.fn('KindleDeviceInfoService.fetchSnapshot')(function* () {
      const availableResult = yield* Effect.result(
        Effect.tryPromise({
          try: () => sdk.isAvailable(),
          catch: (cause) => new KindleUnavailableError({ message: String(cause), cause }),
        })
      )
      if (Result.isFailure(availableResult)) {
        const error = availableResult.failure
        yield* Ref.update(stateRef, (state) => ({ ...state, lastError: Option.some(error) }))
        return yield* error
      }
      if (!availableResult.success) {
        const error = new KindleUnavailableError({ message: 'Kindle unavailable', cause: null })
        yield* Ref.update(stateRef, (state) => ({ ...state, lastError: Option.some(error) }))
        return yield* error
      }

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
        return yield* new KindleUnavailableError({ message: 'No Kindle snapshot available', cause: null })
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

export const Live = Layer.effect(
  KindleDeviceInfoService,
  Effect.gen(function* () {
    const { client: sdk } = yield* KindleSDKService
    return yield* makeDeviceInfoService(sdk)
  })
).pipe(Layer.provide(KindleSDKService.Live))
