import { Effect, Context, Duration, Schedule } from 'effect'
import type { WifiTransportService } from '../core/wifi-transport.js'
import type { WifiTransportConfig } from '../core/transport-config.js'
import { DeviceUnavailableError, DeviceSleepingError } from '../errors/kindle-errors.js'

export interface DeviceAvailabilityService {
  readonly isAvailable: Effect.Effect<boolean>
  readonly waitForAvailable: Effect.Effect<void, DeviceUnavailableError | DeviceSleepingError>
}

export class DeviceAvailability extends Context.Service<DeviceAvailability, DeviceAvailabilityService>()(
  '@bbbook/kindle-sdk/DeviceAvailability'
) {}

export const make = (config: WifiTransportConfig, wifi: WifiTransportService) =>
  Effect.gen(function* () {
    const isAvailable = Effect.gen(function* () {
      const state = yield* wifi.state
      return state._tag === 'Connected'
    })

    const waitForAvailable = Effect.gen(function* () {
      const state = yield* wifi.state
      if (state._tag === 'Connected') {
        return void 0
      }
      return yield* Effect.retry(
        wifi.recover,
        Schedule.spaced(Duration.millis(5000)).pipe(
          Schedule.upTo({ duration: Duration.millis(120000) })
        )
      )
    })

    return { isAvailable, waitForAvailable }
  })
