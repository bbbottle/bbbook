import { Effect } from 'effect'
import type { ExecResult, SshClient } from '../src/core/executor.js'
import type { ResourceThrottlerService } from '../src/core/resource-throttler.js'
import type { TransportState, WifiTransportConfig } from '../src/core/transport-config.js'
import type { WifiTransportService } from '../src/core/wifi-transport.js'
import {
  DeviceSleepingError,
  DeviceUnavailableError,
  type KindleError,
} from '../src/errors/kindle-errors.js'
import type { CommandExecutorService } from '../src/services/command-executor.js'
import type { DeviceAvailabilityService } from '../src/services/device-availability.js'

export const fakeSshClient: SshClient = {
  binary: 'ssh',
  args: ['kindle'],
}

export const defaultWifiConfig = (
  overrides?: Partial<WifiTransportConfig>
): WifiTransportConfig => ({
  sshCmdStr: 'ssh kindle',
  connectionTimeout: 1000,
  heartbeatInterval: 5000,
  commandTimeout: 30000,
  minMemoryMb: 10,
  queueSize: 50,
  maxRetries: 3,
  retryDelayMs: 1000,
  localCacheDir: '/tmp/kindle',
  ...overrides,
})

export interface FakeWifiTransportOptions {
  readonly state?: TransportState
  readonly recover?: Effect.Effect<void, DeviceUnavailableError>
}

export const makeFakeWifiTransport = (
  options: FakeWifiTransportOptions = {}
): WifiTransportService => ({
  state: Effect.succeed(options.state ?? { _tag: 'Connected' }),
  withConnection: ((f: (client: SshClient) => unknown) =>
    f(fakeSshClient)) as unknown as WifiTransportService['withConnection'],
  recover: options.recover ?? Effect.void,
  markSleeping: Effect.void,
  markDisconnected: Effect.void,
})

export const makeFakeResourceThrottler = (): ResourceThrottlerService => ({
  withPermit: ((effect: unknown) => effect) as unknown as ResourceThrottlerService['withPermit'],
  checkMemory: Effect.void,
  cooldown: Effect.void,
})

export interface FakeCommandExecutorOptions {
  readonly execute?: (command: string) => Effect.Effect<ExecResult, KindleError>
}

export const makeFakeCommandExecutor = (
  options: FakeCommandExecutorOptions = {}
): CommandExecutorService => ({
  execute:
    options.execute ??
    (() => Effect.succeed({ stdout: '', stderr: '', code: 0 })),
})

export interface FakeDeviceAvailabilityOptions {
  readonly available?: boolean
  readonly waitForAvailable?: Effect.Effect<
    void,
    DeviceUnavailableError | DeviceSleepingError
  >
}

export const makeFakeDeviceAvailability = (
  options: FakeDeviceAvailabilityOptions = {}
): DeviceAvailabilityService => ({
  isAvailable: Effect.succeed(options.available ?? true),
  waitForAvailable: options.waitForAvailable ?? Effect.void,
})
