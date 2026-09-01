import { Effect, Layer } from 'effect'
import { makeKindleClient } from '../../lib/kindle-client.js'
import { KindleUnavailableError } from '../../shared/schema/errors.js'
import { KindleDeviceInfoService } from './service.js'

const getDeviceInfo = Effect.fn("KindleDeviceInfoService.getDeviceInfo")(function*() {
  return yield* Effect.acquireUseRelease(
    makeKindleClient,
    (sdk) =>
      Effect.tryPromise({
        try: () => sdk.getDeviceInfo(),
        catch: (cause) => new KindleUnavailableError({ message: String(cause), cause }),
      }),
    (sdk, _exit) => Effect.promise(() => sdk.dispose())
  )
})

export const Live = Layer.effect(
  KindleDeviceInfoService,
  Effect.gen(function*() {
    return KindleDeviceInfoService.of({ getDeviceInfo })
  })
)
