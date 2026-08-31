import { Effect, Context } from 'effect'
import type { Client } from 'ssh2'
import * as Executor from '../core/executor.js'
import type { WifiTransportService } from '../core/wifi-transport.js'
import type { ResourceThrottlerService } from '../core/resource-throttler.js'
import { ConnectionLostError, CommandRejectedError, type KindleError } from '../errors/kindle-errors.js'
import { shellQuote } from '../commands/utils.js'

export interface FileTransferService {
  readonly upload: (localPath: string, remotePath: string) => Effect.Effect<void, KindleError>
  readonly download: (remotePath: string, localPath: string) => Effect.Effect<void, KindleError>
  readonly remove: (remotePath: string) => Effect.Effect<void, KindleError>
  readonly restore: (remotePath: string) => Effect.Effect<void, KindleError>
}

export class FileTransfer extends Context.Service<FileTransfer, FileTransferService>()(
  '@bbbook/kindle-sdk/FileTransfer'
) {}

const execGuarded = (client: Client, command: string) =>
  Executor.exec(client, command).pipe(
    Effect.flatMap((result) =>
      result.code === 0
        ? Effect.void
        : Effect.fail(new CommandRejectedError({ command, reason: result.stderr.trim() || `exit code ${result.code}` }))
    )
  )

export const make = (wifi: WifiTransportService, throttler: ResourceThrottlerService) =>
  Effect.gen(function* () {
    const upload = (localPath: string, remotePath: string) =>
      throttler.withPermit(
        wifi.withConnection((client) =>
          Effect.gen(function* () {
            const backupPath = `${remotePath}-bkp`
            const guard = `if [ -e ${shellQuote(remotePath)} ]; then if [ -e ${shellQuote(backupPath)} ]; then echo 'backup already exists' >&2; exit 1; fi; mv ${shellQuote(remotePath)} ${shellQuote(backupPath)}; fi`
            yield* execGuarded(client, guard)
            return yield* Executor.uploadFile(client, localPath, remotePath)
          })
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
          Effect.gen(function* () {
            const backupPath = `${remotePath}-bkp`
            const guard = `if [ -e ${shellQuote(backupPath)} ]; then echo 'backup already exists' >&2; exit 1; fi; mv ${shellQuote(remotePath)} ${shellQuote(backupPath)}`
            yield* execGuarded(client, guard)
          })
        )
      )

    const restore = (remotePath: string) =>
      throttler.withPermit(
        wifi.withConnection((client) =>
          Effect.gen(function* () {
            const backupPath = `${remotePath}-bkp`
            const guard = `if [ -e ${shellQuote(remotePath)} ]; then echo 'origin already exists' >&2; exit 1; fi; mv ${shellQuote(backupPath)} ${shellQuote(remotePath)}`
            yield* execGuarded(client, guard)
          })
        )
      )

    return { upload, download, remove, restore }
  })
