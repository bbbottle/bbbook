import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { mkdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createKindleSDKPromise, type KindleSDK } from '@bbbook/kindle-sdk'

const app = new Hono()

app.get('/up', (c) => c.text('ok'))
app.get('/health', (c) => c.json({ status: 'ok' }))

const STORAGE_PATH = process.env.STORAGE_PATH ?? '/storage/bbbook'
try {
  mkdirSync(STORAGE_PATH, { recursive: true })
} catch {
  // ignore existing directory or permission errors
}

const localCacheDir = STORAGE_PATH
const sshCmdStr = process.env.KINDLE_SSH_CMD ?? 'ssh kindle'

app.get('/kindle/info', async (c) => {
  let kindle: KindleSDK | undefined
  try {
    kindle = await createKindleSDKPromise({ sshCmdStr }, { localCacheDir })
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

const port = Number(process.env.API_PORT ?? '80')
serve({ fetch: app.fetch, port })
console.log(`API listening on http://localhost:${port}`)
