import { API_BASE_URL, getAuthHeaders } from './auth.js'

export interface DeviceInfo {
  serialNumber: string
  freeMemoryMb: number
  freeStorageMb: number
  uptimeSeconds: number
}

export async function fetchDeviceInfo(): Promise<DeviceInfo> {
  const response = await fetch(`${API_BASE_URL}/kindle/info`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({} as { error?: string }))
    throw new Error(payload.error || `Request failed with status ${response.status}`)
  }

  return response.json()
}
