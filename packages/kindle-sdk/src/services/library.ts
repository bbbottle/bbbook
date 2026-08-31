import { Effect, Context } from 'effect'
import type { CommandQueueService } from './command-queue.js'
import type { FileTransferService } from './file-transfer.js'
import * as List from '../commands/library-list.js'
import * as Add from '../commands/library-add.js'
import * as Remove from '../commands/library-remove.js'
import * as Refresh from '../commands/library-refresh.js'
import { ParseError, type KindleError } from '../errors/kindle-errors.js'
import type { Book } from '@bbbook/shared-types'

const DOCUMENTS_FOLDER = '/mnt/us/documents'

export interface LibraryService {
  readonly listBooks: () => Effect.Effect<ReadonlyArray<Book>, KindleError>
  readonly addBook: (localPath: string, fileName: string) => Effect.Effect<void, KindleError>
  readonly removeBook: (fileName: string) => Effect.Effect<void, KindleError>
  readonly restoreBook: (fileName: string) => Effect.Effect<void, KindleError>
  readonly refreshLibrary: () => Effect.Effect<void, KindleError>
}

export class Library extends Context.Service<Library, LibraryService>()(
  '@bbbook/kindle-sdk/Library'
) {}

export const make = (commandQueue: CommandQueueService, fileTransfer: FileTransferService) =>
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
            path: line,
          })
        }
        return books
      })

    const addBook = (localPath: string, fileName: string) =>
      Effect.gen(function* () {
        const remotePath = `${DOCUMENTS_FOLDER}/${fileName}`
        yield* commandQueue.enqueue(Add.ensureLibraryFolder(DOCUMENTS_FOLDER))
        yield* fileTransfer.upload(localPath, remotePath)
        return void 0
      })

    const removeBook = (fileName: string) =>
      Effect.gen(function* () {
        const remotePath = `${DOCUMENTS_FOLDER}/${fileName}`
        yield* commandQueue.enqueue(Remove.removeBook(remotePath))
        return void 0
      })

    const restoreBook = (fileName: string) =>
      Effect.gen(function* () {
        const remotePath = `${DOCUMENTS_FOLDER}/${fileName}`
        yield* commandQueue.enqueue(Remove.restoreBook(remotePath))
        return void 0
      })

    const refreshLibrary = () =>
      Effect.gen(function* () {
        yield* commandQueue.enqueue(Refresh.refreshLibrary())
        return void 0
      })

    return { listBooks, addBook, removeBook, restoreBook, refreshLibrary }
  })
