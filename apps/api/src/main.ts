import { serve } from '@hono/node-server'
import { Layer, ManagedRuntime } from 'effect'
import { createApp } from './app.js'
import { API_PORT } from './config.js'
import { logger } from './lib/logger.js'
import { KindleDeviceInfoService, Live } from './modules/kindle/index.js'

const AppLayer = Layer.mergeAll(Live)

const runtime = ManagedRuntime.make(AppLayer)

const app = createApp(runtime)

const port = Number(API_PORT)
serve({ fetch: app.fetch, port })
logger.info(`API listening on http://localhost:${port}`)

const shutdown = () => {
  void runtime.dispose()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
