import { assert, describe, it } from '@effect/vitest'
import { Duration, Effect, Fiber } from 'effect'
import { TestClock } from 'effect/testing'
import { vi } from 'vitest'
import * as Executor from './executor.js'
import { make as makeResourceThrottler } from './resource-throttler.js'
import { defaultWifiConfig, makeFakeWifiTransport } from '../../test/fakes.js'

vi.mock('./executor.js', async () => {
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

describe('ResourceThrottler', () => {
  it.effect('checkMemory passes when free memory is above the threshold', () =>
    Effect.gen(function* () {
      execMock().mockImplementation(() =>
        Effect.succeed({ stdout: '20', stderr: '', code: 0 })
      )
      const wifi = makeFakeWifiTransport()
      const throttler = yield* makeResourceThrottler(
        defaultWifiConfig({ minMemoryMb: 10 }),
        wifi
      )
      yield* throttler.checkMemory
    }))

  it.effect('checkMemory fails when free memory is below the threshold', () =>
    Effect.gen(function* () {
      execMock().mockImplementation(() =>
        Effect.succeed({ stdout: '5', stderr: '', code: 0 })
      )
      const wifi = makeFakeWifiTransport()
      const throttler = yield* makeResourceThrottler(
        defaultWifiConfig({ minMemoryMb: 10 }),
        wifi
      )
      const error = yield* Effect.flip(throttler.checkMemory)
      assert.strictEqual(error._tag, 'ResourceExhaustedError')
      assert.strictEqual((error as any).current, 5)
      assert.strictEqual((error as any).threshold, 10)
    }))

  it.effect('checkMemory fails with TimeoutError when free memory check hangs', () =>
    Effect.gen(function* () {
      execMock().mockImplementation(() =>
        Effect.sleep(Duration.millis(1000000)).pipe(
          Effect.as({ stdout: '20', stderr: '', code: 0 })
        )
      )
      const wifi = makeFakeWifiTransport()
      const throttler = yield* makeResourceThrottler(
        defaultWifiConfig({ minMemoryMb: 10 }),
        wifi
      )
      const fiber = yield* Effect.forkScoped(throttler.checkMemory)
      yield* TestClock.adjust(5000)
      const error = yield* Effect.flip(Fiber.join(fiber))
      assert.strictEqual(error._tag, 'TimeoutError')
      assert.strictEqual((error as any).timeoutMs, 5000)
    }))

  it.effect('withPermit checks memory, runs the effect, and cools down', () =>
    Effect.gen(function* () {
      execMock().mockImplementation(() =>
        Effect.succeed({ stdout: '20', stderr: '', code: 0 })
      )
      const wifi = makeFakeWifiTransport()
      const throttler = yield* makeResourceThrottler(
        defaultWifiConfig({ minMemoryMb: 10 }),
        wifi
      )
      const fiber = yield* Effect.forkScoped(
        throttler.withPermit(Effect.succeed('done'))
      )
      yield* TestClock.adjust(500)
      const result = yield* Fiber.join(fiber)
      assert.strictEqual(result, 'done')
    }))
})
