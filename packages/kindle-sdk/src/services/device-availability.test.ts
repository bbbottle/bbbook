import { assert, describe, it } from '@effect/vitest'
import { Effect, Fiber } from 'effect'
import { TestClock } from 'effect/testing'
import { DeviceUnavailableError } from '../errors/kindle-errors.js'
import { make as makeDeviceAvailability } from './device-availability.js'
import { defaultSshConfig, makeFakeSshTransport } from '../../test/fakes.js'

describe('DeviceAvailability', () => {
  it.effect('isAvailable returns true when connected', () =>
    Effect.gen(function* () {
      const transport = makeFakeSshTransport({ state: { _tag: 'Connected' } })
      const availability = yield* makeDeviceAvailability(
        defaultSshConfig(),
        transport
      )
      const available = yield* availability.isAvailable
      assert.isTrue(available)
    }))

  it.effect('isAvailable returns false when disconnected', () =>
    Effect.gen(function* () {
      const transport = makeFakeSshTransport({ state: { _tag: 'Disconnected' } })
      const availability = yield* makeDeviceAvailability(
        defaultSshConfig(),
        transport
      )
      const available = yield* availability.isAvailable
      assert.isFalse(available)
    }))

  it.effect('waitForAvailable succeeds when connected', () =>
    Effect.gen(function* () {
      const transport = makeFakeSshTransport({ state: { _tag: 'Connected' } })
      const availability = yield* makeDeviceAvailability(
        defaultSshConfig(),
        transport
      )
      yield* availability.waitForAvailable
    }))

  it.effect('waitForAvailable succeeds when recover succeeds', () =>
    Effect.gen(function* () {
      const transport = makeFakeSshTransport({
        state: { _tag: 'Disconnected' },
        recover: Effect.void,
      })
      const availability = yield* makeDeviceAvailability(
        defaultSshConfig(),
        transport
      )
      yield* availability.waitForAvailable
    }))

  it.effect('waitForAvailable fails after exhausting the recovery schedule', () =>
    Effect.gen(function* () {
      const transport = makeFakeSshTransport({
        state: { _tag: 'Disconnected' },
        recover: Effect.fail(new DeviceUnavailableError({ lastSeenAt: 0 })),
      })
      const availability = yield* makeDeviceAvailability(
        defaultSshConfig(),
        transport
      )
      const fiber = yield* Effect.forkScoped(availability.waitForAvailable)
      yield* TestClock.adjust(130000)
      const error = yield* Effect.flip(Fiber.join(fiber))
      assert.strictEqual(error._tag, 'DeviceUnavailableError')
    }))
})
