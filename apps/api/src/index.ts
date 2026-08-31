import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createKindleSDKPromise, type KindleSDK } from '@bbbook/kindle-sdk'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

const kindleConnectionOptions = {
  host: process.env.KINDLE_HOST ?? '192.168.15.244',
  username: process.env.KINDLE_USERNAME ?? 'root',
  password: process.env.KINDLE_PASSWORD ?? 'mario',
  connectionTimeout: Number(process.env.KINDLE_CONNECTION_TIMEOUT ?? '10000'),
}

app.get('/kindle/info', async (c) => {
  let kindle: KindleSDK | undefined
  try {
    kindle = await createKindleSDKPromise(kindleConnectionOptions)
    const info = await kindle.getDeviceInfo()
    return c.json(info)
  } catch (error) {
    return c.json({ error: String(error) }, 500)
  } finally {
    await kindle?.dispose()
  }
})

const port = Number(process.env.API_PORT ?? '3000')
serve({ fetch: app.fetch, port })
console.log(`API listening on http://localhost:${port}`)
