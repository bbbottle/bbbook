import { Effect } from 'effect'
import { createKindleSDKPromise, type KindleSDK } from '@bbbook/kindle-sdk'
import { KINDLE_SSH_CMD, STORAGE_PATH } from '../config.js'
import { KindleUnavailableError } from '../shared/schema/errors.js'

export const makeKindleClient: Effect.Effect<KindleSDK, KindleUnavailableError> = Effect.tryPromise({
  try: () => createKindleSDKPromise({ sshCmdStr: KINDLE_SSH_CMD }, { localCacheDir: STORAGE_PATH }),
  catch: (cause) => new KindleUnavailableError({ message: String(cause), cause }),
})
