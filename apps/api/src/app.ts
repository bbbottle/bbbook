import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { readFile } from 'node:fs/promises'
import { Effect, ManagedRuntime } from 'effect'
import { WEB_DIST_PATH } from './config.js'
import { createHealthRouter } from './modules/health/index.js'
import { createKindleRouter, KindleDeviceInfoService } from './modules/kindle/index.js'
import { auth } from './shared/middleware/auth.js'
import { errorHandler } from './shared/middleware/error-handler.js'

export const createApp = (
  runtime: ManagedRuntime.ManagedRuntime<KindleDeviceInfoService, never>
) => {
  const app = new Hono()

  app.onError(errorHandler)
  app.use(auth)

  app.route('/', createHealthRouter())
  app.route('/kindle', createKindleRouter(runtime))

  app.use('/*', serveStatic({ root: WEB_DIST_PATH }))
  app.get('/*', async (c) =>
    c.html(await readFile(`${WEB_DIST_PATH}/index.html`, 'utf8'))
  )

  return app
}
