import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { readFile } from 'node:fs/promises'
import { Effect, ManagedRuntime } from 'effect'
import { WEB_DIST_PATH } from './config.js'
import { auth } from './shared/middleware/auth.js'
import { errorHandler } from './shared/middleware/error-handler.js'
import { createHealthRouter } from './modules/health/index.js'
import { createKindleRouter, KindleDeviceInfoService } from './modules/kindle/index.js'
import { authRouter } from './modules/auth/index.js'
import type { TokenService, TotpService, UserRepository } from './modules/auth/index.js'

export const createApp = (
  runtime: ManagedRuntime.ManagedRuntime<
    KindleDeviceInfoService | TokenService | TotpService | UserRepository,
    never
  >
) => {
  const app = new Hono()

  app.onError(errorHandler)

  app.route('/', createHealthRouter())
  app.route('/auth', authRouter(runtime))
  app.use('/kindle/*', auth)
  app.route('/kindle', createKindleRouter(runtime))

  app.use('/*', serveStatic({ root: WEB_DIST_PATH }))
  app.get('/*', async (c) =>
    c.html(await readFile(`${WEB_DIST_PATH}/index.html`, 'utf8'))
  )

  return app
}
