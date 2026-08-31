import type { KindleConnectionOptions } from '@bbbook/shared-types'

export interface WifiTransportConfig extends KindleConnectionOptions {
  readonly heartbeatInterval?: number
  readonly commandTimeout?: number
  readonly minMemoryMb?: number
  readonly queueSize?: number
  readonly maxRetries?: number
  readonly retryDelayMs?: number
}

export const defaultWifiTransportConfig = (config: WifiTransportConfig): WifiTransportConfig => ({
  host: config.host,
  username: config.username,
  password: config.password,
  privateKey: config.privateKey,
  port: config.port ?? 22,
  connectionTimeout: config.connectionTimeout ?? 10000,
  heartbeatInterval: config.heartbeatInterval ?? 5000,
  commandTimeout: config.commandTimeout ?? 30000,
  minMemoryMb: config.minMemoryMb ?? 10,
  queueSize: config.queueSize ?? 50,
  maxRetries: config.maxRetries ?? 3,
  retryDelayMs: config.retryDelayMs ?? 1000,
})

export type TransportState =
  | { readonly _tag: 'Disconnected' }
  | { readonly _tag: 'Connected' }
  | { readonly _tag: 'Sleeping' }
  | { readonly _tag: 'Recovering' }
