import type { KindleConnectionOptions } from '@bbbook/shared-types'

export interface SshTransportConfig extends KindleConnectionOptions {
  readonly heartbeatInterval?: number
  readonly commandTimeout?: number
  readonly minMemoryMb?: number
  readonly queueSize?: number
  readonly maxRetries?: number
  readonly retryDelayMs?: number
  readonly localCacheDir?: string
}

export const defaultSshTransportConfig = (config: SshTransportConfig): SshTransportConfig => ({
  sshCmdStr: config.sshCmdStr,
  connectionTimeout: config.connectionTimeout ?? 10000,
  heartbeatInterval: config.heartbeatInterval ?? 5000,
  commandTimeout: config.commandTimeout ?? 30000,
  minMemoryMb: config.minMemoryMb ?? 10,
  queueSize: config.queueSize ?? 50,
  maxRetries: config.maxRetries ?? 3,
  retryDelayMs: config.retryDelayMs ?? 1000,
  localCacheDir: config.localCacheDir,
})

export type TransportState =
  | { readonly _tag: 'Disconnected' }
  | { readonly _tag: 'Connected' }
  | { readonly _tag: 'Sleeping' }
  | { readonly _tag: 'Recovering' }
