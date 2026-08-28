import { Effect } from 'effect'
import type { Book } from '@bbbook/shared-types'
import type { KindleConnection } from '../core/connection.js'
import * as Lipc from '../commands/lipc.js'

export const listBooks = (connection: KindleConnection, folder = '/mnt/us/documents') =>
  Effect.gen(function* () {
    const { stdout } = yield* connection.exec(Lipc.listDocuments(folder))
    const lines = stdout.split('\n').filter(Boolean)
    const books: Book[] = lines.map((path, index) => ({
      id: String(index + 1),
      title: path.split('/').pop() ?? path,
      path,
    }))
    return books
  })

export const uploadBook = (connection: KindleConnection, localPath: string, remoteFolder = '/mnt/us/documents') =>
  Effect.gen(function* () {
    const fileName = localPath.split('/').pop() ?? 'book'
    const remotePath = `${remoteFolder}/${fileName}`
    yield* connection.exec(`mkdir -p ${remoteFolder}`)
    yield* connection.uploadFile(localPath, remotePath)
    return remotePath
  })

export const openBook = (connection: KindleConnection, bookPath: string) =>
  Effect.gen(function* () {
    yield* connection.exec(Lipc.openBook(bookPath))
    return true
  })
