import { Effect, Context, Cause, Duration } from 'effect'
import * as Executor from '../core/executor.js'
import {
  TimeoutError,
  DeviceBusyError,
  PermissionDeniedError,
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

export const make = (config: WifiTransportConfig, wifi: WifiTransportService, throttler: ResourceThrottlerService) =>
  Effect.gen(function* () {
    const execute = (command: string) =>
      throttler.withPermit(
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

    return { execute } satisfies CommandExecutorService
  })
