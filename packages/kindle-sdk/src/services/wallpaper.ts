import { Effect, Context } from 'effect'
import type { CommandQueueService } from './command-queue.js'
import type { FileTransferService } from './file-transfer.js'
import * as WallpaperCommand from '../commands/wallpaper-batch.js'
import { CommandRejectedError, type KindleError } from '../errors/kindle-errors.js'
import type { Wallpaper } from '../types/index.js'

const WALLPAPER_FOLDER = '/mnt/us/system/screen_saver'

export interface WallpaperService {
  readonly applyWallpapers: (wallpapers: ReadonlyArray<Wallpaper>) => Effect.Effect<void, KindleError>
  readonly backupWallpapers: () => Effect.Effect<void, KindleError>
  readonly restoreWallpapers: () => Effect.Effect<void, KindleError>
}

export class WallpaperManager extends Context.Service<WallpaperManager, WallpaperService>()(
  '@bbbook/kindle-sdk/WallpaperManager'
) {}

const requireExitZero = (command: string) =>
  Effect.flatMap((result: { stdout: string; stderr: string; code: number }) =>
    result.code === 0
      ? Effect.void
      : Effect.fail(new CommandRejectedError({ command, reason: result.stderr.trim() || `exit code ${result.code}` }))
  )

export const make = (commandQueue: CommandQueueService, fileTransfer: FileTransferService) =>
  Effect.gen(function* () {
    const run = (command: string, timeoutMs?: number) =>
      commandQueue.enqueue(command, timeoutMs).pipe(requireExitZero(command))

    const backupWallpapers: WallpaperService['backupWallpapers'] = () =>
      Effect.gen(function* () {
        yield* run(WallpaperCommand.backupWallpapers(WALLPAPER_FOLDER), 60000)
        return void 0
      })

    const restoreWallpapers: WallpaperService['restoreWallpapers'] = () =>
      Effect.gen(function* () {
        yield* run(WallpaperCommand.restoreWallpapers(WALLPAPER_FOLDER), 60000)
        return void 0
      })

    const applyWallpapers: WallpaperService['applyWallpapers'] = (wallpapers) =>
      Effect.gen(function* () {
        yield* run(WallpaperCommand.ensureWallpaperFolder(WALLPAPER_FOLDER))
        yield* backupWallpapers()
        for (const wallpaper of wallpapers) {
          yield* fileTransfer.upload(wallpaper.localPath, wallpaper.remotePath)
        }
        for (const wallpaper of wallpapers) {
          yield* run(WallpaperCommand.applyWallpaper(wallpaper.remotePath))
        }
        return void 0
      })

    return { applyWallpapers, backupWallpapers, restoreWallpapers }
  })
