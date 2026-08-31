import { Effect, Context, Queue, Deferred, Duration, Cause } from 'effect'
import type { CommandExecutorService } from './command-executor.js'
import type { DeviceAvailabilityService } from './device-availability.js'
import { TimeoutError, QueueFullError, type KindleError } from '../errors/kindle-errors.js'
import type { WifiTransportConfig } from '../core/transport-config.js'
import type { ExecResult } from '../core/executor.js'

export interface CommandQueueService {
  readonly enqueue: (command: string, timeoutMs?: number) => Effect.Effect<ExecResult, KindleError | QueueFullError>
}

export class CommandQueue extends Context.Service<CommandQueue, CommandQueueService>()(
  '@bbbook/kindle-sdk/CommandQueue'
) {}

interface QueueItem {
  readonly command: string
  readonly timeoutMs?: number
  readonly deferred: Deferred.Deferred<ExecResult, KindleError>
}

export const make = (
  config: WifiTransportConfig,
  commandExecutor: CommandExecutorService,
  deviceAvailability: DeviceAvailabilityService
) =>
  Effect.gen(function* () {
    const queue = yield* Queue.bounded<QueueItem>(config.queueSize ?? 50)

    const worker = Effect.forever(
      Effect.gen(function* () {
        const item = yield* Queue.take(queue)
        yield* deviceAvailability.waitForAvailable
        const result = commandExecutor.execute(item.command).pipe(
          Effect.timeout(
            Duration.millis(item.timeoutMs ?? config.commandTimeout ?? 30000)
          ),
          Effect.catchIf(Cause.isTimeoutError, () =>
            Effect.fail(
              new TimeoutError({
                command: item.command,
                timeoutMs: item.timeoutMs ?? config.commandTimeout ?? 30000,
              })
            )
          )
        )
        yield* Deferred.complete(item.deferred, result)
      })
    )

    yield* Effect.forkScoped(worker)

    const enqueue = (command: string, timeoutMs?: number) =>
      Effect.gen(function* () {
        const deferred = yield* Deferred.make<ExecResult, KindleError>()
        const item: QueueItem = { command, timeoutMs, deferred }
        const offered = yield* Queue.offer(queue, item)
        if (!offered) {
          return yield* Effect.fail(
            new QueueFullError({ queueSize: config.queueSize ?? 50 })
          )
        }
        return yield* Deferred.await(deferred)
      })

    return { enqueue }
  })
