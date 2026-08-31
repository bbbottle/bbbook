import { Effect, Context } from 'effect'
import * as Executor from '../core/executor.js'
import type { WifiTransportService } from '../core/wifi-transport.js'
import type { ResourceThrottlerService } from '../core/resource-throttler.js'
import { ConnectionLostError, type KindleError } from '../errors/kindle-errors.js'
import { shellQuote } from '../commands/utils.js'

export interface FileTransferService {
  readonly upload: (localPath: string, remotePath: string) => Effect.Effect<void, KindleError>
  readonly download: (remotePath: string, localPath: string) => Effect.Effect<void, KindleError>
  readonly remove: (remotePath: string) => Effect.Effect<void, KindleError>
}

export class FileTransfer extends Context.Service<FileTransfer, FileTransferService>()(
  '@bbbook/kindle-sdk/FileTransfer'
) {}

export const make = (wifi: WifiTransportService, throttler: ResourceThrottlerService) =>
  Effect.gen(function* () {
    const upload = (localPath: string, remotePath: string) =>
      throttler.withPermit(
        wifi.withConnection((client) =>
          Executor.uploadFile(client, localPath, remotePath)
        )
      )

    const download = (remotePath: string, localPath: string) =>
      throttler.withPermit(
        wifi.withConnection((client) =>
          Executor.downloadFile(client, remotePath, localPath)
        )
      )

    const remove = (remotePath: string) =>
      throttler.withPermit(
        wifi.withConnection((client) =>
          Executor.exec(client, `rm -f ${shellQuote(remotePath)}`)
        )
      )

    return { upload, download, remove }
  })
