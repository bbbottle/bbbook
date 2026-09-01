import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { mkdirSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createKindleSDKPromise, type KindleSDK } from '@bbbook/kindle-sdk'
import type { KindleConnectionOptions } from '@bbbook/shared-types'

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

const expandTilde = (p: string) => (p.startsWith('~') ? join(homedir(), p.slice(1)) : p)

const resolveKindleSSHConfig = (host = 'kindle'): Partial<KindleConnectionOptions> | undefined => {
  const result = spawnSync('ssh', ['-G', host], { encoding: 'utf8', timeout: 5000 })
  if (result.error || result.status !== 0) return undefined

  const lines = result.stdout.split('\n')
  const get = (key: string) => {
    const prefix = key.toLowerCase() + ' '
    const line = lines.find((l) => l.toLowerCase().startsWith(prefix))
    return line ? line.slice(prefix.length).trim() : undefined
  }

  const hostName = get('hostname')
  const user = get('user')
  const port = Number(get('port') ?? '22')

  if (!hostName || !user) return undefined

  const identityFiles = lines
    .filter((l) => l.toLowerCase().startsWith('identityfile '))
    .map((l) => l.slice('identityfile '.length).trim())
    .filter((p) => p && p !== 'none' && !p.startsWith('/dev/null'))

  let privateKey: string | undefined
  for (const raw of identityFiles) {
    const p = expandTilde(raw)
    try {
      privateKey = readFileSync(p, 'utf8')
      break
    } catch {
      // try next identity file
    }
  }

  if (!privateKey) return undefined

  return { host: hostName, username: user, port, privateKey, connectionTimeout: 10000 }
}

const kindleOptions = resolveKindleSSHConfig()

app.get('/kindle/info', async (c) => {
  if (!kindleOptions || !kindleOptions.host || !kindleOptions.username || !kindleOptions.privateKey) {
    return c.json({ error: 'Kindle SSH not configured. Configure `ssh kindle` with a private key.' }, 503)
  }

  let kindle: KindleSDK | undefined
  try {
    kindle = await createKindleSDKPromise(kindleOptions as KindleConnectionOptions, { localCacheDir })
    const info = await kindle.getDeviceInfo()
    return c.json(info)
  } catch (error) {
    return c.json({ error: String(error) }, 500)
  } finally {
    await kindle?.dispose()
  }
})

app.use('/*', serveStatic({ root: './apps/web/dist' }))
app.get('/*', async (c) => c.html(await readFile('./apps/web/dist/index.html', 'utf8')))

const port = Number(process.env.API_PORT ?? '80')
serve({ fetch: app.fetch, port })
console.log(`API listening on http://localhost:${port}`)
