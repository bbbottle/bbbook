import { Effect, Context } from 'effect'
import type { CommandQueueService } from './command-queue.js'
import type { FileTransferService } from './file-transfer.js'
import * as ScreenshotCommand from '../commands/screenshot.js'
import { type KindleError } from '../errors/kindle-errors.js'
import * as NodePath from 'node:path'
import * as NodeFs from 'node:fs'

const TEMP_REMOTE = '/tmp/kindle-sdk-screenshot.png'

export interface ScreenshotService {
  readonly takeScreenshot: (localPath: string) => Effect.Effect<void, KindleError>
}

export class Screenshot extends Context.Service<Screenshot, ScreenshotService>()(
  '@bbbook/kindle-sdk/Screenshot'
) {}

export const make = (commandQueue: CommandQueueService, fileTransfer: FileTransferService) =>
  Effect.gen(function* () {
    const takeScreenshot = (localPath: string) =>
      Effect.gen(function* () {
        yield* commandQueue.enqueue(ScreenshotCommand.captureScreenshot(TEMP_REMOTE))
        yield* Effect.promise<void>((_signal) =>
          new Promise((resolve) => {
            try {
              NodeFs.mkdirSync(NodePath.dirname(localPath), { recursive: true })
            } catch {
              // ignore existing directory or permission errors; the download will surface real failures
            }
            resolve()
          })
        )
        yield* fileTransfer.download(TEMP_REMOTE, localPath)
      }).pipe(Effect.asVoid)

    return { takeScreenshot }
  })
