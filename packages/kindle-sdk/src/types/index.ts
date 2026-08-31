import type { KindleConnectionOptions as SharedKindleConnectionOptions, KindleDeviceInfo as SharedKindleDeviceInfo } from '@bbbook/shared-types'

export type KindleConnectionOptions = SharedKindleConnectionOptions

export interface DeviceInfo extends SharedKindleDeviceInfo {
  readonly serialNumber: string
  readonly freeMemoryMb: number
  readonly freeStorageMb: number
  readonly uptimeSeconds: number
}

export interface QueueItem {
  readonly command: string
  readonly timeoutMs?: number
  readonly retries: number
}

export interface Font {
  readonly id: string
  readonly name: string
  readonly path: string
}

export interface Wallpaper {
  readonly id: string
  readonly localPath: string
  readonly remotePath: string
}
