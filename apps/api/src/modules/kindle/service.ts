import { Context, Effect } from 'effect'
import type { Book, DeviceInfo } from '@bbbook/kindle-sdk'
import { InvalidRequestError } from '../auth/errors.js'
import { KindleSnapshotPendingError, KindleUnavailableError } from '../../shared/schema/errors.js'

export class KindleDeviceInfoService extends Context.Service<
  KindleDeviceInfoService,
  {
    getDeviceInfo(): Effect.Effect<
      { readonly info: DeviceInfo; readonly stale: boolean },
      KindleSnapshotPendingError | KindleUnavailableError
    >
    refresh(): Effect.Effect<DeviceInfo, KindleUnavailableError>
    invalidateCache(): Effect.Effect<void>
  }
>()('@bbbook/api/modules/kindle/KindleDeviceInfoService') {}

export class KindleLibraryService extends Context.Service<
  KindleLibraryService,
  {
    listBooks(): Effect.Effect<ReadonlyArray<Book>, KindleUnavailableError>
    addBook(localPath: string, fileName: string): Effect.Effect<void, KindleUnavailableError | InvalidRequestError>
    removeBook(fileName: string): Effect.Effect<void, KindleUnavailableError | InvalidRequestError>
    restoreBook(fileName: string): Effect.Effect<void, KindleUnavailableError | InvalidRequestError>
    refreshLibrary(): Effect.Effect<void, KindleUnavailableError>
    openBook(fileName: string): Effect.Effect<void, KindleUnavailableError | InvalidRequestError>
  }
>()('@bbbook/api/modules/kindle/KindleLibraryService') {}
