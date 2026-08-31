import { Effect, Context } from 'effect'
import type { CommandQueueService } from './command-queue.js'
import type { FileTransferService } from './file-transfer.js'
import * as FontList from '../commands/font-list.js'
import * as FontAdd from '../commands/font-add.js'
import * as FontRemove from '../commands/font-remove.js'
import * as FontRefresh from '../commands/font-refresh-cache.js'
import { FontValidationError, ParseError, type KindleError } from '../errors/kindle-errors.js'
import type { Font } from '../types/index.js'
import * as NodePath from 'node:path'

const FONT_FOLDER = '/mnt/us/fonts'

const allowedExtensions = new Set(['.ttf', '.otf'])

export interface FontManagerService {
  readonly listFonts: () => Effect.Effect<ReadonlyArray<Font>, KindleError>
  readonly addFont: (localPath: string, fileName: string) => Effect.Effect<void, KindleError>
  readonly removeFont: (fileName: string) => Effect.Effect<void, KindleError>
  readonly restoreFont: (fileName: string) => Effect.Effect<void, KindleError>
  readonly refreshFontCache: () => Effect.Effect<void, KindleError>
}

export class FontManager extends Context.Service<FontManager, FontManagerService>()(
  '@bbbook/kindle-sdk/FontManager'
) {}

export const make = (commandQueue: CommandQueueService, fileTransfer: FileTransferService) =>
  Effect.gen(function* () {
    const listFonts = () =>
      Effect.gen(function* () {
        const result = yield* commandQueue.enqueue(FontList.listFonts(FONT_FOLDER))
        const lines = result.stdout.trim().split('\n').filter(Boolean)
        const fonts: Array<Font> = []
        for (const line of lines) {
          const match = line.match(/\/?([^/]+)$/)
          const fileName = match ? match[1] : line
          fonts.push({
            id: fileName,
            name: fileName.replace(/\.(ttf|otf)$/i, ''),
            path: line,
          })
        }
        return fonts
      })

    const validateFont = (fileName: string) =>
      Effect.gen(function* () {
        const ext = NodePath.extname(fileName).toLowerCase()
        if (!allowedExtensions.has(ext)) {
          return yield* Effect.fail(
            new FontValidationError({ path: fileName, reason: `Unsupported font extension: ${ext}` })
          )
        }
        if (/\.[^.]{1,4}\.(exe|sh|bat|bin)$/i.test(fileName)) {
          return yield* Effect.fail(
            new FontValidationError({ path: fileName, reason: 'Font file contains executable-like pattern' })
          )
        }
        return void 0
      })

    const addFont = (localPath: string, fileName: string) =>
      Effect.gen(function* () {
        yield* validateFont(fileName)
        const remotePath = `${FONT_FOLDER}/${fileName}`
        yield* commandQueue.enqueue(FontAdd.ensureFontFolder(FONT_FOLDER))
        yield* fileTransfer.upload(localPath, remotePath)
        return void 0
      })

    const removeFont = (fileName: string) =>
      Effect.gen(function* () {
        const remotePath = `${FONT_FOLDER}/${fileName}`
        yield* commandQueue.enqueue(FontRemove.removeFont(remotePath))
        return void 0
      })

    const restoreFont = (fileName: string) =>
      Effect.gen(function* () {
        const remotePath = `${FONT_FOLDER}/${fileName}`
        yield* commandQueue.enqueue(FontRemove.restoreFont(remotePath))
        return void 0
      })

    const refreshFontCache = () =>
      Effect.gen(function* () {
        yield* commandQueue.enqueue(FontRefresh.refreshFontCache())
        return void 0
      })

    return { listFonts, addFont, removeFont, restoreFont, refreshFontCache }
  })
