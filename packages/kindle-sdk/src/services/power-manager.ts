import { Effect, Context } from 'effect'
import type { CommandQueueService } from './command-queue.js'
import * as LockScreen from '../commands/lock-screen.js'
import type { KindleError } from '../errors/kindle-errors.js'

export interface PowerManagerService {
  readonly lockScreen: () => Effect.Effect<void, KindleError>
}

export class PowerManager extends Context.Service<PowerManager, PowerManagerService>()(
  '@bbbook/kindle-sdk/PowerManager'
) {}

export const make = (commandQueue: CommandQueueService) =>
  Effect.gen(function* () {
    const lockScreen = () =>
      Effect.gen(function* () {
        yield* commandQueue.enqueue(LockScreen.lockScreen())
        return void 0
      })

    return { lockScreen }
  })
