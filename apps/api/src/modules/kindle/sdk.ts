import { Context, Effect, Layer } from 'effect'
import type { KindleSDK } from '@bbbook/kindle-sdk'
import { makeKindleClient } from '../../lib/kindle-client.js'

export class KindleSDKService extends Context.Service<
  KindleSDKService,
  { readonly client: KindleSDK }
>()('@bbbook/api/modules/kindle/KindleSDKService') {
  static readonly Live = Layer.effect(
    KindleSDKService,
    Effect.acquireRelease(
      makeKindleClient,
      (sdk, _exit) => Effect.promise(() => sdk.dispose().catch(() => undefined))
    ).pipe(Effect.map((client) => KindleSDKService.of({ client })))
  )
}
