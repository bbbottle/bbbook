import { ApiError, get } from '../../../shared/api/client.js'

const DEVICE_UNAVAILABLE_RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const

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

function wait(delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay))
}

export async function fetchDeviceInfo(): Promise<DeviceInfo> {
  for (const delay of DEVICE_UNAVAILABLE_RETRY_DELAYS_MS) {
    try {
      return await get('/kindle/info')
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== 'DEVICE_UNAVAILABLE') {
        throw error
      }
      await wait(delay)
    }
  }
  return get('/kindle/info')
}
