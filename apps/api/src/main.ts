import { serve, type ServerType } from '@hono/node-server'
import { Layer, ManagedRuntime } from 'effect'
import type { Server } from 'node:http'
import { createApp } from './app.js'
import { API_PORT } from './config.js'
import { logger } from './lib/logger.js'
import { KindleDeviceInfoService, Live } from './modules/kindle/index.js'

const AppLayer = Layer.mergeAll(Live)
const runtime = ManagedRuntime.make(AppLayer)
const app = createApp(runtime)
const port = Number(API_PORT)

const server: ServerType = serve({ fetch: app.fetch, port }, (info) => {
  logger.info(`API listening on http://${info.address}:${info.port}`)
})

let shuttingDown = false

const shutdown = async (signal: string) => {
  if (shuttingDown) {
    logger.warn(`Received ${signal} while already shutting down`)
    return
  }
  shuttingDown = true
  logger.info(`Received ${signal}, shutting down...`)

  try {
    await new Promise<void>((resolve) => {
      const forceTimeout = setTimeout(() => {
        logger.warn('Graceful drain timed out; forcing connections closed')
        ;(server as Server).closeAllConnections?.()
      }, 10000)

      server.close(() => {
        clearTimeout(forceTimeout)
        resolve()
      })
    })
    logger.info('HTTP server closed')
  } catch (error) {
    logger.error('Error closing HTTP server:', error)
  }

  try {
    await runtime.dispose()
    logger.info('ManagedRuntime disposed')
  } catch (error) {
    logger.error('Error disposing ManagedRuntime:', error)
  }

  process.exit(0)
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
