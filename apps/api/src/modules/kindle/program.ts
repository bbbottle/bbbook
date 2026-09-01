import { Effect, Duration, Result, Layer, Option, Ref } from 'effect'
import type { DeviceInfo, KindleSDK } from '@bbbook/kindle-sdk'
import { KindleUnavailableError } from '../../shared/schema/errors.js'
import { KINDLE_SYNC_INTERVAL_MS } from '../../config.js'
import { KindleSDKService } from './sdk.js'
import { KindleDeviceInfoService } from './service.js'

const CACHE_TTL_MS = 30 * 1000

const makeDeviceInfoService = (sdk: KindleSDK) =>
  Effect.gen(function* () {
    const snapshotRef = yield* Ref.make<Option.Option<DeviceInfo>>(Option.none())

    const [cached, invalidate] = yield* Effect.cachedInvalidateWithTTL(
      Effect.gen(function* () {
        const available = yield* Effect.tryPromise({
          try: () => sdk.isAvailable(),
          catch: (cause) => new KindleUnavailableError({ message: String(cause), cause }),
        })
        if (!available) {
          return yield* new KindleUnavailableError({ message: 'Kindle unavailable', cause: null })
        }
        const info = yield* Effect.tryPromise({
          try: () => sdk.getDeviceInfo(),
          catch: (cause) => new KindleUnavailableError({ message: String(cause), cause }),
        })
        yield* Ref.set(snapshotRef, Option.some(info))
        return info
      }),
      Duration.millis(CACHE_TTL_MS)
    )

    const getDeviceInfo = Effect.fn('KindleDeviceInfoService.getDeviceInfo')(function* () {
      const result = yield* Effect.result(cached)
      if (Result.isSuccess(result)) {
        return { info: result.success, stale: false }
      }
      const staleOpt = yield* Ref.get(snapshotRef)
      if (Option.isSome(staleOpt)) {
        return { info: staleOpt.value, stale: true }
      }
      return yield* Effect.fail(result.failure)
    })

    const refresh = Effect.fn('KindleDeviceInfoService.refresh')(function* () {
      yield* Effect.tryPromise({
        try: () => sdk.waitForAvailable(),
        catch: (cause) => new KindleUnavailableError({ message: String(cause), cause }),
      })
      yield* invalidate
      return yield* cached
    })

    const invalidateCache = Effect.fn('KindleDeviceInfoService.invalidateCache')(function* () {
      yield* invalidate
    })

    if (KINDLE_SYNC_INTERVAL_MS > 0) {
      const syncEffect = Effect.catch(refresh(), (error) =>
        Effect.logError('Kindle background sync failed', error)
      )
      yield* Effect.forkScoped(
        Effect.forever(Effect.delay(syncEffect, Duration.millis(KINDLE_SYNC_INTERVAL_MS)))
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
