import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { mkdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createKindleSDKPromise, type KindleSDK } from '@bbbook/kindle-sdk'
import { Layer, ManagedRuntime } from 'effect'
import { API_PORT, AUTH_SEED_USERS, KINDLE_SSH_CMD, STORAGE_PATH } from './config.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { TokenService } from './modules/auth/token.service.js'
import { TotpService } from './modules/auth/totp.service.js'
import { UserRepository } from './modules/auth/user.repository.js'

try {
  mkdirSync(STORAGE_PATH, { recursive: true })
} catch {
  // ignore existing directory or permission errors
}

const AppLayer = Layer.merge(
  UserRepository.layer,
  Layer.merge(TotpService.layer, TokenService.layer)
)

const runtime = ManagedRuntime.make(AppLayer, {
  memoMap: Layer.makeMemoMapUnsafe()
})

const auth = authRoutes(runtime)

const app = new Hono()

app.get('/up', (c) => c.text('ok'))
app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/auth', auth)

app.get('/kindle/info', async (c) => {
  const header = c.req.header('authorization')
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) {
    return c.json({ message: 'Missing authorization header' }, 401)
  }

  const access = await runtime.runPromise(
    TokenService.use((svc) => svc.verifyAccessToken(token))
  ).catch(() => undefined)

  if (!access) {
    return c.json({ message: 'Invalid or expired access token' }, 401)
  }

  let kindle: KindleSDK | undefined
  try {
    kindle = await createKindleSDKPromise({ sshCmdStr: KINDLE_SSH_CMD }, { localCacheDir: STORAGE_PATH })
    const info = await kindle.getDeviceInfo()
    return c.json(info)
  } catch (error) {
    return c.json({ error: String(error) }, 503)
  } finally {
    await kindle?.dispose()
  }
})

app.use('/*', serveStatic({ root: './apps/web/dist' }))
app.get('/*', async (c) => c.html(await readFile('./apps/web/dist/index.html', 'utf8')))

const port = API_PORT

async function start() {
  await runtime.runPromise(UserRepository.use((repo) => repo.seed(AUTH_SEED_USERS)))
  serve({ fetch: app.fetch, port })
  console.log(`API listening on http://localhost:${port}`)
}

start().catch((error) => {
  console.error('Failed to start API', error)
  process.exit(1)
})
