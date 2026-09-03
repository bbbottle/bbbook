import { randomUUID } from 'node:crypto'
import * as NodeFs from 'node:fs/promises'
import { Effect, ManagedRuntime } from 'effect'
import { Hono } from 'hono'
import { UPLOAD_PATH } from '../../config.js'
import { handleExit } from '../../shared/middleware/error-handler.js'
import { InvalidRequestError } from '../auth/errors.js'
import { KindleUnavailableError } from '../../shared/schema/errors.js'
import { KindleDeviceInfoService, KindleLibraryService } from './service.js'

export const createKindleRouter = (
  runtime: ManagedRuntime.ManagedRuntime<
    KindleDeviceInfoService | KindleLibraryService,
    KindleUnavailableError | InvalidRequestError
  >
) => {
  const router = new Hono()

  router.get('/info', async (c) => {
    const exit = await runtime.runPromiseExit(
      KindleDeviceInfoService.use((service) => service.getDeviceInfo())
    )
    return handleExit(exit, c, ({ info, stale }) => {
      if (stale) {
        c.header('X-Data-Stale', 'true')
      }
      return c.json(info)
    })
  })

  router.get('/books', async (c) => {
    const exit = await runtime.runPromiseExit(
      KindleLibraryService.use((service) => service.listBooks())
    )
    return handleExit(exit, c, (books) => c.json({ books }))
  })

  router.post('/books', async (c) => {
    const body = await c.req.parseBody()
    const file = body.file
    if (!(file instanceof File)) {
      return c.json({ error: { code: 'INVALID_REQUEST_BODY' } }, 400)
    }
    const fileName = file.name
    const tempName = `${Date.now()}-${randomUUID()}-${fileName}`
    const tempPath = `${UPLOAD_PATH}/${tempName}`
    await NodeFs.writeFile(tempPath, new Uint8Array(await file.arrayBuffer()))

    const exit = await runtime.runPromiseExit(
      KindleLibraryService.use((service) => service.addBook(tempPath, fileName))
    )
    return handleExit(exit, c, () => c.json({ success: true }))
  })

  router.delete('/books/:fileName', async (c) => {
    const fileName = decodeURIComponent(c.req.param('fileName'))
    const exit = await runtime.runPromiseExit(
      KindleLibraryService.use((service) => service.removeBook(fileName))
    )
    return handleExit(exit, c, () => c.json({ success: true }))
  })

  router.post('/books/:fileName/restore', async (c) => {
    const fileName = decodeURIComponent(c.req.param('fileName'))
    const exit = await runtime.runPromiseExit(
      KindleLibraryService.use((service) => service.restoreBook(fileName))
    )
    return handleExit(exit, c, () => c.json({ success: true }))
  })

  router.post('/books/:fileName/open', async (c) => {
    const fileName = decodeURIComponent(c.req.param('fileName'))
    const exit = await runtime.runPromiseExit(
      KindleLibraryService.use((service) => service.openBook(fileName))
    )
    return handleExit(exit, c, () => c.json({ success: true }))
  })

  router.post('/books/refresh', async (c) => {
    const exit = await runtime.runPromiseExit(
      KindleLibraryService.use((service) => service.refreshLibrary())
    )
    return handleExit(exit, c, () => c.json({ success: true }))
  })

  return router
}
