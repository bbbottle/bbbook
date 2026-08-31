import { Effect, Context } from 'effect'
import type { CommandQueueService } from './command-queue.js'
import type { FileTransferService } from './file-transfer.js'
import * as WallpaperCommand from '../commands/wallpaper-batch.js'
import { type KindleError } from '../errors/kindle-errors.js'
import type { Wallpaper } from '../types/index.js'

const WALLPAPER_FOLDER = '/mnt/us/system/screen_saver'

export interface WallpaperService {
  readonly applyWallpapers: (wallpapers: ReadonlyArray<Wallpaper>) => Effect.Effect<void, KindleError>
}

export class WallpaperManager extends Context.Service<WallpaperManager, WallpaperService>()(
  '@bbbook/kindle-sdk/WallpaperManager'
) {}

export const make = (commandQueue: CommandQueueService, fileTransfer: FileTransferService) =>
  Effect.gen(function* () {
    const applyWallpapers = (wallpapers: ReadonlyArray<Wallpaper>) =>
      Effect.gen(function* () {
        for (const wallpaper of wallpapers) {
          yield* fileTransfer.upload(wallpaper.localPath, wallpaper.remotePath)
        }
        for (const wallpaper of wallpapers) {
          yield* commandQueue.enqueue(WallpaperCommand.applyWallpaper(wallpaper.remotePath))
        }
        return void 0
      })

    return { applyWallpapers }
  })
