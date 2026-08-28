import { Effect } from 'effect'
import type { KindleConnection } from '../core/connection.js'
import * as Lipc from '../commands/lipc.js'

export const getBatteryLevel = (connection: KindleConnection) =>
  Effect.gen(function* () {
    const { stdout } = yield* connection.exec(Lipc.getBatteryLevel())
    const level = parseInt(stdout.trim(), 10)
    if (Number.isNaN(level)) {
      return yield* Effect.fail(new Error(`Invalid battery level: ${stdout}`))
    }
    return level
  })

export const isCharging = (connection: KindleConnection) =>
  Effect.gen(function* () {
    const { stdout } = yield* connection.exec(Lipc.getBatteryCharging())
    return stdout.trim().toLowerCase() === 'true' || stdout.trim() === '1'
  })
