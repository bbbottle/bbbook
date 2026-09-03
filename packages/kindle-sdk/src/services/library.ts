import { Effect, Context } from 'effect'
import * as NodeFs from 'node:fs'
import * as NodePath from 'node:path'
import type { CommandQueueService } from './command-queue.js'
import type { FileTransferService } from './file-transfer.js'
import * as List from '../commands/library-list.js'
import * as Add from '../commands/library-add.js'
import * as Open from '../commands/library-open.js'
import * as Refresh from '../commands/library-refresh.js'
import { CommandRejectedError, type KindleError } from '../errors/kindle-errors.js'
import type { Book } from '@bbbook/shared-types'

const DOCUMENTS_FOLDER = '/mnt/us/documents'

export interface LibraryService {
  readonly listBooks: () => Effect.Effect<ReadonlyArray<Book>, KindleError>
  readonly addBook: (localPath: string, fileName: string) => Effect.Effect<void, KindleError>
  readonly removeBook: (fileName: string) => Effect.Effect<void, KindleError>
  readonly restoreBook: (fileName: string) => Effect.Effect<void, KindleError>
  readonly refreshLibrary: () => Effect.Effect<void, KindleError>
  readonly openBook: (fileName: string) => Effect.Effect<void, KindleError>
}

export class Library extends Context.Service<Library, LibraryService>()(
  '@bbbook/kindle-sdk/Library'
) {}

export const make = (
  commandQueue: CommandQueueService,
  fileTransfer: FileTransferService,
  backupDir?: string
) =>
  Effect.gen(function* () {
    const listBooks = () =>
      Effect.gen(function* () {
        const result = yield* commandQueue.enqueue(List.listDocuments(DOCUMENTS_FOLDER))
        const lines = result.stdout.trim().split('\n').filter(Boolean)
        const books: Array<Book> = []
        for (const line of lines) {
          const match = line.match(/\/?([^/]+)$/)
          const fileName = match ? match[1] : line
          const id = fileName.replace(/\.(azw|azw3|mobi|epub|pdf)$/i, '')
          books.push({
            id,
            title: fileName,
            fileName,
            path: line,
          })
        }
        return books
      })

    const addBook = (localPath: string, fileName: string) =>
      Effect.gen(function* () {
        const remotePath = `${DOCUMENTS_FOLDER}/${fileName}`
        const exists = yield* fileTransfer.exists(remotePath)
        if (exists) {
          return yield* Effect.fail(
            new CommandRejectedError({ command: 'addBook', reason: 'file already exists on device' })
          )
        }
        yield* commandQueue.enqueue(Add.ensureLibraryFolder(DOCUMENTS_FOLDER))
        yield* fileTransfer.upload(localPath, remotePath)
        yield* commandQueue.enqueue(Refresh.refreshLibrary()).pipe(Effect.catch(() => Effect.void))
        return void 0
      })

    const removeBook = (fileName: string) =>
      Effect.gen(function* () {
        if (!backupDir) {
          return yield* Effect.fail(
            new CommandRejectedError({ command: 'removeBook', reason: 'backup directory is not configured' })
          )
        }
        const remotePath = `${DOCUMENTS_FOLDER}/${fileName}`
        const localBackupPath = NodePath.join(backupDir, fileName)
        const remoteExists = yield* fileTransfer.exists(remotePath)
        if (!remoteExists) {
          return yield* Effect.fail(
            new CommandRejectedError({ command: 'removeBook', reason: 'file not found on device' })
          )
        }
        yield* fileTransfer.download(remotePath, localBackupPath)
        yield* fileTransfer.delete(remotePath)
        yield* commandQueue.enqueue(Refresh.refreshLibrary()).pipe(Effect.catch(() => Effect.void))
        return void 0
      })

    const restoreBook = (fileName: string) =>
      Effect.gen(function* () {
        if (!backupDir) {
          return yield* Effect.fail(
            new CommandRejectedError({ command: 'restoreBook', reason: 'backup directory is not configured' })
          )
        }
        const remotePath = `${DOCUMENTS_FOLDER}/${fileName}`
        const localBackupPath = NodePath.join(backupDir, fileName)
        const backupExists = yield* Effect.sync(() => NodeFs.existsSync(localBackupPath))
        if (!backupExists) {
          return yield* Effect.fail(
            new CommandRejectedError({ command: 'restoreBook', reason: 'backup not found in storage' })
          )
        }
        const remoteExists = yield* fileTransfer.exists(remotePath)
        if (remoteExists) {
          return yield* Effect.fail(
            new CommandRejectedError({ command: 'restoreBook', reason: 'book already exists on device' })
          )
        }
        yield* fileTransfer.upload(localBackupPath, remotePath)
        yield* commandQueue.enqueue(Refresh.refreshLibrary()).pipe(Effect.catch(() => Effect.void))
        yield* Effect.try(() => {
          NodeFs.unlinkSync(localBackupPath)
        }).pipe(Effect.catch(() => Effect.void))
        return void 0
      })

    const refreshLibrary = () =>
      Effect.gen(function* () {
        yield* commandQueue.enqueue(Refresh.refreshLibrary())
        return void 0
      })

    const openBook = (fileName: string) =>
      Effect.gen(function* () {
        const remotePath = `${DOCUMENTS_FOLDER}/${fileName}`
        yield* commandQueue.enqueue(Open.openBook(remotePath))
        return void 0
      })

    return { listBooks, addBook, removeBook, restoreBook, refreshLibrary, openBook }
  })
