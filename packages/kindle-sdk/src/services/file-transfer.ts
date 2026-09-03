import { Effect, Context } from 'effect'
import { randomUUID } from 'node:crypto'
import * as NodePath from 'node:path'
import * as NodeFs from 'node:fs'
import * as Executor from '../core/executor.js'
import type { SshClient } from '../core/executor.js'
import type { SshTransportService } from '../core/ssh-transport.js'
import type { ResourceThrottlerService } from '../core/resource-throttler.js'
import { ConnectionLostError, CommandRejectedError, type KindleError } from '../errors/kindle-errors.js'
import { shellQuote } from '../commands/utils.js'

export interface FileTransferService {
  readonly upload: (localPath: string, remotePath: string) => Effect.Effect<void, KindleError>
  readonly download: (remotePath: string, localPath?: string) => Effect.Effect<void, KindleError>
  readonly remove: (remotePath: string) => Effect.Effect<void, KindleError>
  readonly restore: (remotePath: string) => Effect.Effect<void, KindleError>
  readonly exists: (remotePath: string) => Effect.Effect<boolean, KindleError>
  readonly delete: (remotePath: string) => Effect.Effect<void, KindleError>
}

const resolveLocalPath = (localCacheDir: string | undefined, remotePath: string, localPath?: string) => {
  if (localPath) return NodePath.resolve(localPath)
  if (!localCacheDir) throw new Error('localCacheDir is required when localPath is not provided')
  return NodePath.join(localCacheDir, NodePath.basename(remotePath))
}

export class FileTransfer extends Context.Service<FileTransfer, FileTransferService>()(
  '@bbbook/kindle-sdk/FileTransfer'
) {}

const execGuarded = (client: SshClient, command: string) =>
  Executor.exec(client, command).pipe(
    Effect.flatMap((result) =>
      result.code === 0
        ? Effect.void
        : Effect.fail(new CommandRejectedError({ command, reason: result.stderr.trim() || `exit code ${result.code}` }))
    )
  )

const remoteExists = (client: SshClient, path: string) =>
  Executor.exec(client, `test -e ${shellQuote(path)}`).pipe(Effect.map((result) => result.code === 0))

const move = (client: SshClient, source: string, destination: string) =>
  Executor.exec(client, `mv ${shellQuote(source)} ${shellQuote(destination)}`).pipe(
    Effect.flatMap((result) =>
      result.code === 0
        ? Effect.void
        : Effect.fail(
            new CommandRejectedError({
              command: `mv ${source} ${destination}`,
              reason: result.stderr.trim() || `exit code ${result.code}`,
            })
          )
    )
  )

const isTempPath = (path: string) => path.includes('.tmp-')

const cleanTemp = (client: SshClient, tempPath: string) =>
  isTempPath(tempPath)
    ? Executor.exec(client, `rm -f -- ${shellQuote(tempPath)}`).pipe(
        Effect.asVoid,
        Effect.catch(() => Effect.void)
      )
    : Effect.void

export const make = (
  transport: SshTransportService,
  throttler: ResourceThrottlerService,
  localCacheDir?: string
) =>
  Effect.gen(function* () {
    const upload = (localPath: string, remotePath: string) =>
      throttler.withPermit(
        transport.withConnection((client) =>
          Effect.gen(function* () {
            const backupPath = `${remotePath}-bkp`
            const tempPath = `${remotePath}.tmp-${randomUUID()}`

            const originalExists = yield* remoteExists(client, remotePath)
            if (originalExists) {
              const backupExists = yield* remoteExists(client, backupPath)
              if (backupExists) {
                return yield* Effect.fail(
                  new CommandRejectedError({
                    command: 'upload guard',
                    reason: 'backup already exists',
                  })
                )
              }
            }

            // Write the replacement to a temporary path first. If this fails the original
            // file is untouched; clean up any partial temp file before returning the error.
            yield* Executor.uploadFile(client, localPath, tempPath).pipe(
              Effect.tapError(() => cleanTemp(client, tempPath))
            )

            if (originalExists) {
              // Move the original out of the way to the backup path.
              const moveBackupResult = yield* Executor.exec(
                client,
                `mv ${shellQuote(remotePath)} ${shellQuote(backupPath)}`
              )
              if (moveBackupResult.code !== 0) {
                yield* cleanTemp(client, tempPath)
                return yield* Effect.fail(
                  new CommandRejectedError({
                    command: `mv ${remotePath} ${backupPath}`,
                    reason: moveBackupResult.stderr.trim() || 'failed to move original to backup',
                  })
                )
              }
            }

            // Atomically (within the same filesystem) commit the uploaded temp file.
            const moveFinalResult = yield* Executor.exec(
              client,
              `mv ${shellQuote(tempPath)} ${shellQuote(remotePath)}`
            )
            if (moveFinalResult.code !== 0) {
              if (originalExists) {
                // Try to restore the original from the backup. Only restore if the target
                // path is not occupied, otherwise we would overwrite an unexpected file.
                const finalPathOccupied = yield* remoteExists(client, remotePath)
                if (!finalPathOccupied) {
                  yield* Effect.ignore(move(client, backupPath, remotePath))
                }
              }
              yield* cleanTemp(client, tempPath)
              return yield* Effect.fail(
                new CommandRejectedError({
                  command: `mv ${tempPath} ${remotePath}`,
                  reason: moveFinalResult.stderr.trim() || 'failed to move temp to final path',
                })
              )
            }

            // Success: the temp path no longer exists; this is a no-op.
            yield* cleanTemp(client, tempPath)
          })
        )
      )

    const download = (remotePath: string, localPath?: string) =>
      throttler.withPermit(
        transport.withConnection((client) =>
          Effect.gen(function* () {
            const targetPath = resolveLocalPath(localCacheDir, remotePath, localPath)
            yield* Effect.try(() => {
              NodeFs.mkdirSync(NodePath.dirname(targetPath), { recursive: true })
            }).pipe(Effect.catch(() => Effect.void))
            return yield* Executor.downloadFile(client, remotePath, targetPath)
          })
        )
      )

    const remove = (remotePath: string) =>
      throttler.withPermit(
        transport.withConnection((client) =>
          Effect.gen(function* () {
            const backupPath = `${remotePath}-bkp`
            const guard = `if [ -e ${shellQuote(backupPath)} ]; then echo 'backup already exists' >&2; exit 1; fi; mv ${shellQuote(remotePath)} ${shellQuote(backupPath)}`
            yield* execGuarded(client, guard)
          })
        )
      )

    const restore = (remotePath: string) =>
      throttler.withPermit(
        transport.withConnection((client) =>
          Effect.gen(function* () {
            const backupPath = `${remotePath}-bkp`
            const guard = `if [ -e ${shellQuote(remotePath)} ]; then echo 'origin already exists' >&2; exit 1; fi; mv ${shellQuote(backupPath)} ${shellQuote(remotePath)}`
            yield* execGuarded(client, guard)
          })
        )
      )

    const exists = (remotePath: string) =>
      throttler.withPermit(
        transport.withConnection((client) => remoteExists(client, remotePath))
      )

    const deleteFile = (remotePath: string) =>
      throttler.withPermit(
        transport.withConnection((client) =>
          execGuarded(client, `rm -f -- ${shellQuote(remotePath)}`)
        )
      )

    return { upload, download, remove, restore, exists, delete: deleteFile }
  })
