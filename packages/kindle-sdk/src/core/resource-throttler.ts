import { Effect, Semaphore, Duration, Context } from 'effect'
import type { WifiTransportService } from './wifi-transport.js'
import {
  KindleError,
  ResourceExhaustedError,
  TimeoutError,
  ConnectionLostError,
} from '../errors/kindle-errors.js'
import * as Executor from './executor.js'
import type { WifiTransportConfig } from './transport-config.js'

export interface ResourceThrottlerService {
  readonly withPermit: <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ) => Effect.Effect<A, E | KindleError, R>
  readonly checkMemory: Effect.Effect<void, KindleError>
  readonly cooldown: Effect.Effect<void>
}

export class ResourceThrottler extends Context.Service<ResourceThrottler, ResourceThrottlerService>()(
  '@bbbook/kindle-sdk/ResourceThrottler'
) {}

const freeMemoryCommand = "free -m | awk 'NR==2{print $7}'"
const dropCachesCommand = 'sync && echo 3 > /proc/sys/vm/drop_caches'

const parseFreeMemory = (stdout: string) => {
  const value = Number.parseInt(stdout.trim(), 10)
  return Number.isNaN(value) ? 0 : value
}

export const make = (config: WifiTransportConfig, wifi: WifiTransportService) =>
  Effect.gen(function* () {
    const semaphore = yield* Semaphore.make(1)

    const checkMemory: Effect.Effect<void, KindleError> =
      Effect.gen(function* () {
        const result = yield* wifi.withConnection((client) =>
          Executor.exec(client, freeMemoryCommand).pipe(
            Effect.timeoutOrElse({
              duration: Duration.millis(5000),
              orElse: () => Effect.fail(new TimeoutError({ command: freeMemoryCommand, timeoutMs: 5000 })),
            })
          )
        )
        const freeMb = parseFreeMemory(result.stdout)
        if (freeMb < (config.minMemoryMb ?? 10)) {
          yield* Effect.log('Memory low, dropping caches')
          const dropResult = yield* wifi.withConnection((client) =>
            Executor.exec(client, dropCachesCommand).pipe(
              Effect.timeoutOrElse({
                duration: Duration.millis(10000),
                orElse: () => Effect.fail(new TimeoutError({ command: dropCachesCommand, timeoutMs: 10000 })),
              })
            )
          )
          yield* Effect.sleep(Duration.millis(500))
          const recheck = yield* wifi.withConnection((client) =>
            Executor.exec(client, freeMemoryCommand).pipe(
              Effect.timeoutOrElse({
                duration: Duration.millis(5000),
                orElse: () => Effect.fail(new TimeoutError({ command: freeMemoryCommand, timeoutMs: 5000 })),
              })
            )
          )
          const recheckMb = parseFreeMemory(recheck.stdout)
          if (recheckMb < (config.minMemoryMb ?? 10)) {
            return yield* Effect.fail(
              new ResourceExhaustedError({
                resource: 'memory',
                current: recheckMb,
                threshold: config.minMemoryMb ?? 10,
              })
            )
          }
          return void 0
        }
        return void 0
      })

    const cooldown = Effect.sleep(Duration.millis(500))

    const withPermit = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
      semaphore.withPermits(1)(
        Effect.gen(function* () {
          yield* checkMemory
          const result = yield* effect
          yield* cooldown
          return result
        })
      )

    const service: ResourceThrottlerService = {
      withPermit,
      checkMemory,
      cooldown,
    }

    return service
  })
