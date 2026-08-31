import { Effect, Context } from 'effect'
import type { CommandQueueService } from './command-queue.js'
import type { FileTransferService } from './file-transfer.js'
import * as ScreenshotCommand from '../commands/screenshot.js'
import { type KindleError } from '../errors/kindle-errors.js'
import * as NodePath from 'node:path'
import * as NodeFs from 'node:fs'

const TEMP_REMOTE = '/tmp/kindle-sdk-screenshot.png'

const defaultScreenshotPath = (localCacheDir: string | undefined) => {
  if (!localCacheDir) throw new Error('localCacheDir is required when localPath is not provided')
  const dir = NodePath.join(localCacheDir, 'screenshots')
  NodeFs.mkdirSync(dir, { recursive: true })
  return NodePath.join(dir, `${Date.now()}.png`)
}

export interface ScreenshotService {
  readonly takeScreenshot: (localPath?: string) => Effect.Effect<void, KindleError>
}

export class Screenshot extends Context.Service<Screenshot, ScreenshotService>()(
  '@bbbook/kindle-sdk/Screenshot'
) {}

export const make = (
  commandQueue: CommandQueueService,
  fileTransfer: FileTransferService,
  localCacheDir?: string
) =>
  Effect.gen(function* () {
    const takeScreenshot = (localPath?: string) =>
      Effect.gen(function* () {
        const targetPath = localPath ?? defaultScreenshotPath(localCacheDir)
        yield* commandQueue.enqueue(ScreenshotCommand.captureScreenshot(TEMP_REMOTE))
        yield* Effect.try(() => {
          NodeFs.mkdirSync(NodePath.dirname(targetPath), { recursive: true })
        }).pipe(Effect.catch(() => Effect.void))
        yield* fileTransfer.download(TEMP_REMOTE, targetPath)
      }).pipe(Effect.asVoid)

    return { takeScreenshot }
  })
