import { assert, describe, it } from '@effect/vitest'
import { Deferred, Effect } from 'effect'
import { vi } from 'vitest'
import { DeviceBusyError } from '../errors/kindle-errors.js'
import { make as makeCommandQueue } from './command-queue.js'
import {
  defaultWifiConfig,
  makeFakeCommandExecutor,
  makeFakeDeviceAvailability,
} from '../../test/fakes.js'

describe('CommandQueue', () => {
  it.effect('enqueue returns the executor result', () =>
    Effect.gen(function* () {
      const execute = vi.fn((command: string) =>
        Effect.succeed({ stdout: `out:${command}`, stderr: '', code: 0 })
      )
      const commandExecutor = makeFakeCommandExecutor({ execute })
      const deviceAvailability = makeFakeDeviceAvailability()
      const queue = yield* makeCommandQueue(
        defaultWifiConfig(),
        commandExecutor,
        deviceAvailability
      )
      const result = yield* queue.enqueue('echo hello')
      assert.strictEqual(result.stdout, 'out:echo hello')
      assert.strictEqual(execute.mock.calls.length, 1)
    }))

  it.effect('enqueue forwards executor errors', () =>
    Effect.gen(function* () {
      const execute = vi.fn(() =>
        Effect.fail(new DeviceBusyError({ command: 'x' }))
      )
      const commandExecutor = makeFakeCommandExecutor({ execute })
      const deviceAvailability = makeFakeDeviceAvailability()
      const queue = yield* makeCommandQueue(
        defaultWifiConfig(),
        commandExecutor,
        deviceAvailability
      )
      const error = yield* Effect.flip(queue.enqueue('x'))
      assert.strictEqual(error._tag, 'DeviceBusyError')
    }))

  it.effect('enqueue returns QueueFullError when the queue is full', () =>
    Effect.gen(function* () {
      const taken = yield* Deferred.make<void>()
      const execute = vi.fn(() =>
        Deferred.succeed(taken, undefined).pipe(Effect.andThen(Effect.never))
      )
      const commandExecutor = makeFakeCommandExecutor({ execute })
      const deviceAvailability = makeFakeDeviceAvailability()
      const queue = yield* makeCommandQueue(
        defaultWifiConfig({ queueSize: 1 }),
        commandExecutor,
        deviceAvailability
      )
      yield* Effect.forkScoped(queue.enqueue('a'))
      yield* Deferred.await(taken)
      yield* Effect.forkScoped(queue.enqueue('b'))
      yield* Effect.yieldNow
      const error = yield* Effect.flip(queue.enqueue('c'))
      assert.strictEqual(error._tag, 'QueueFullError')
    }))
})
