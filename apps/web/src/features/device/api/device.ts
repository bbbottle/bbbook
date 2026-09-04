import { get } from '../../../shared/api/client.js'

export interface DeviceInfo {
  serialNumber: string
  freeMemoryMb: number
  freeStorageMb: number
  uptimeSeconds: number
  batteryLevel?: number
  isCharging?: boolean
  modelName?: string
  wifi?: {
    ssid?: string
    signal?: number
  }
}

export function fetchDeviceInfo(): Promise<DeviceInfo> {
  return get('/kindle/info')
}
