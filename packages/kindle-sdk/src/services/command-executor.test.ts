import { assert, beforeEach, describe, it } from '@effect/vitest'
import { Duration, Effect, Fiber } from 'effect'
import { TestClock } from 'effect/testing'
import { vi } from 'vitest'
import * as Executor from '../core/executor.js'
import { make as makeCommandExecutor } from './command-executor.js'
import {
  defaultWifiConfig,
  makeFakeResourceThrottler,
  makeFakeWifiTransport,
} from '../../test/fakes.js'

vi.mock('../core/executor.js', async () => {
  const { Effect } = await import('effect')
  return {
    connect: vi.fn(() => Effect.succeed({ binary: 'ssh', args: ['kindle'] })),
    disconnect: vi.fn(() => Effect.void),
    downloadFile: vi.fn(() => Effect.void),
    exec: vi.fn((client: unknown, command: string) =>
      Effect.succeed({ stdout: '', stderr: '', code: 0 })
    ),
    uploadFile: vi.fn(() => Effect.void),
  }
})

const execMock = () => (Executor as any).exec

describe('CommandExecutor', () => {
  beforeEach(() => execMock().mockClear())
  it.effect('executes a valid command and returns the result', () =>
    Effect.gen(function* () {
      execMock().mockImplementation((client: unknown, command: string) =>
        Effect.succeed({ stdout: command, stderr: '', code: 0 })
      )
      const wifi = makeFakeWifiTransport()
      const throttler = makeFakeResourceThrottler()
      const executor = yield* makeCommandExecutor(
        defaultWifiConfig({ commandTimeout: 100 }),
        wifi,
        throttler
      )
      const result = yield* executor.execute('echo hello')
      assert.strictEqual(result.code, 0)
      assert.strictEqual(result.stdout, 'echo hello')
      assert.strictEqual((execMock().mock.calls[0] as any[])[1], 'echo hello')
    }))

  it.effect('rejects commands with forbidden keywords', () =>
    Effect.gen(function* () {
      execMock().mockImplementation(() =>
        Effect.succeed({ stdout: '', stderr: '', code: 0 })
      )
      const wifi = makeFakeWifiTransport()
      const throttler = makeFakeResourceThrottler()
      const executor = yield* makeCommandExecutor(
        defaultWifiConfig(),
        wifi,
        throttler
      )
      const error = yield* Effect.flip(executor.execute('rm -rf /'))
      assert.strictEqual(error._tag, 'CommandRejectedError')
      assert.strictEqual(execMock().mock.calls.length, 0)
    }))

  it.effect('classifies permission denied errors', () =>
    Effect.gen(function* () {
      execMock().mockImplementation(() =>
        Effect.succeed({
          stdout: '',
          stderr: 'permission denied',
          code: 1,
        })
      )
      const wifi = makeFakeWifiTransport()
      const throttler = makeFakeResourceThrottler()
      const executor = yield* makeCommandExecutor(
        defaultWifiConfig(),
        wifi,
        throttler
      )
      const error = yield* Effect.flip(executor.execute('ls /secret'))
      assert.strictEqual(error._tag, 'PermissionDeniedError')
    }))

  it.effect('classifies busy device errors', () =>
    Effect.gen(function* () {
      execMock().mockImplementation(() =>
        Effect.succeed({ stdout: '', stderr: 'device is busy', code: 1 })
      )
      const wifi = makeFakeWifiTransport()
      const throttler = makeFakeResourceThrottler()
      const executor = yield* makeCommandExecutor(
        defaultWifiConfig(),
        wifi,
        throttler
      )
      const error = yield* Effect.flip(executor.execute('some command'))
      assert.strictEqual(error._tag, 'DeviceBusyError')
    }))

  it.effect('fails with TimeoutError when the command hangs', () =>
    Effect.gen(function* () {
      execMock().mockImplementation(() =>
        Effect.sleep(Duration.millis(1000000)).pipe(
          Effect.as({ stdout: '', stderr: '', code: 0 })
        )
      )
      const wifi = makeFakeWifiTransport()
      const throttler = makeFakeResourceThrottler()
      const executor = yield* makeCommandExecutor(
        defaultWifiConfig({ commandTimeout: 100 }),
        wifi,
        throttler
      )
      const fiber = yield* Effect.forkScoped(
        executor.execute('sleep 10')
      )
      yield* TestClock.adjust(100)
      const error = yield* Effect.flip(Fiber.join(fiber))
      assert.strictEqual(error._tag, 'TimeoutError')
      assert.strictEqual((error as any).timeoutMs, 100)
    }))
})
