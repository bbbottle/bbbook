import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { readFile } from 'node:fs/promises'
import { Effect, ManagedRuntime } from 'effect'
import { WEB_DIST_PATH } from './config.js'
import { createAuthMiddleware, requireAdmin } from './shared/middleware/auth.js'
import { errorHandler } from './shared/middleware/error-handler.js'
import { kindleRateLimiter } from './shared/middleware/kindle-rate-limiter.js'
import { createHealthRouter } from './modules/health/index.js'
import { createKindleRouter, KindleDeviceInfoService } from './modules/kindle/index.js'
import { authRouter } from './modules/auth/index.js'
import { adminRouter } from './modules/admin/index.js'
import type { TokenService, TotpService, UserRepository } from './modules/auth/index.js'
import { KindleUnavailableError } from './shared/schema/errors.js'

export const createApp = (
  runtime: ManagedRuntime.ManagedRuntime<
    KindleDeviceInfoService | TokenService | TotpService | UserRepository,
    KindleUnavailableError
  >
) => {
  const app = new Hono()

  const auth = createAuthMiddleware(runtime)

  app.onError(errorHandler)

  app.route('/', createHealthRouter())
  app.route('/auth', authRouter(runtime, auth))
  app.use('/kindle/*', kindleRateLimiter, auth)
  app.route('/kindle', createKindleRouter(runtime))

  app.use('/admin/*', auth, requireAdmin)
  app.route('/admin', adminRouter(runtime))

  app.use('/*', serveStatic({ root: WEB_DIST_PATH }))
  app.get('/*', async (c) =>
    c.html(await readFile(`${WEB_DIST_PATH}/index.html`, 'utf8'))
  )

  return app
}
