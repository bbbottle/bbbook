import { Effect, ManagedRuntime } from 'effect'
import { Hono } from 'hono'
import { handleExit } from '../../shared/middleware/error-handler.js'
import { KindleDeviceInfoService } from './service.js'

export const createKindleRouter = (
  runtime: ManagedRuntime.ManagedRuntime<KindleDeviceInfoService, never>
) => {
  const router = new Hono()

  router.get('/info', async (c) => {
    const exit = await runtime.runPromiseExit(
      KindleDeviceInfoService.use((service) => service.getDeviceInfo())
    )
    return handleExit(exit, c, (info) => c.json(info))
  })

  return router
}
