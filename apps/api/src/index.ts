import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Effect } from 'effect'
import { Kindle } from '@bbbook/kindle-sdk'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

app.get('/kindle/info', async (c) => {
  const program = Effect.gen(function* () {
    const kindle = yield* Kindle.make({
      host: process.env.KINDLE_HOST ?? '192.168.15.244',
      username: process.env.KINDLE_USERNAME ?? 'root',
      password: process.env.KINDLE_PASSWORD ?? 'mario',
      connectionTimeout: Number(process.env.KINDLE_CONNECTION_TIMEOUT ?? '10000'),
    })
    return yield* kindle.getDeviceInfo()
  }).pipe(Effect.catch((error) => Effect.succeed({ error: String(error) })))

  const result = await Effect.runPromise(program)
  return c.json(result)
})

const port = Number(process.env.API_PORT ?? '3000')
serve({ fetch: app.fetch, port })
console.log(`API listening on http://localhost:${port}`)
