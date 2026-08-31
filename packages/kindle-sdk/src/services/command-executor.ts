import { Effect, Context, Cause, Duration } from 'effect'
import * as Executor from '../core/executor.js'
import {
  TimeoutError,
  DeviceBusyError,
  PermissionDeniedError,
  CommandRejectedError,
  type KindleError,
} from '../errors/kindle-errors.js'
import type { WifiTransportConfig } from '../core/transport-config.js'
import type { WifiTransportService } from '../core/wifi-transport.js'
import type { ResourceThrottlerService } from '../core/resource-throttler.js'
import type { ExecResult } from '../core/executor.js'

export interface CommandExecutorService {
  readonly execute: (command: string) => Effect.Effect<ExecResult, KindleError>
}

export class CommandExecutor extends Context.Service<CommandExecutor, CommandExecutorService>()(
  '@bbbook/kindle-sdk/CommandExecutor'
) {}

const classifyError = (result: Executor.ExecResult, command: string): Effect.Effect<never, KindleError> => {
  const stderr = result.stderr.toLowerCase()
  if (stderr.includes('permission') || stderr.includes('denied')) {
    return Effect.fail(new PermissionDeniedError({ command }))
  }
  if (stderr.includes('busy') || result.code === 126 || result.code === 127) {
    return Effect.fail(new DeviceBusyError({ command }))
  }
  return Effect.fail(new DeviceBusyError({ command }))
}

// Disallow command families that can cause irreversible damage or network/Wi-Fi manipulation.
// This is a defence-in-depth guard on the internal command executor; all commands should
// still be constructed through the typed command builders exported by the package.
const FORBIDDEN_KEYWORDS = [
  'rm', 'dd', 'mkfs', 'reboot', 'shutdown', 'poweroff', 'halt', 'kill', 'umount', 'fsck',
  'fdisk', 'parted', 'mkswap', 'swapon', 'swapoff', 'curl', 'wget', 'nc', 'bash', 'sh',
  'python', 'perl', 'wpa_cli'
]

const validateCommand = (command: string): string | undefined => {
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i')
    if (pattern.test(command)) {
      return `Forbidden command keyword '${keyword}'`
    }
  }
  if (/\blipc-set-prop\b[\s\S]*?\bcom\.lab126\.wifid\b/i.test(command)) {
    return 'Wi-Fi manipulation commands are prohibited'
  }
  return undefined
}

const validateCommandEffect = (command: string): Effect.Effect<void, CommandRejectedError> => {
  const reason = validateCommand(command)
  if (reason) {
    return Effect.fail(new CommandRejectedError({ command, reason }))
  }
  return Effect.void
}

export const make = (config: WifiTransportConfig, wifi: WifiTransportService, throttler: ResourceThrottlerService) =>
  Effect.gen(function* () {
    const execute = Effect.fn(function* (command: string) {
      yield* validateCommandEffect(command)
      const result = yield* throttler.withPermit(
        wifi.withConnection((client) =>
          Executor.exec(client, command).pipe(
            Effect.timeout(Duration.millis(config.commandTimeout ?? 30000)),
            Effect.catchIf(Cause.isTimeoutError, () =>
              Effect.fail(new TimeoutError({ command, timeoutMs: config.commandTimeout ?? 30000 }))
            ),
            Effect.flatMap((result) =>
              result.code === 0 ? Effect.succeed(result) : classifyError(result, command)
            )
          )
        )
      )
      return result
    })

    return { execute } satisfies CommandExecutorService
  })
