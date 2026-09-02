import { API_BASE_URL, getAuthHeaders } from './auth.js'

export interface DeviceInfo {
  serialNumber: string
  freeMemoryMb: number
  freeStorageMb: number
  uptimeSeconds: number
}

export class KindleError extends Error {
  code: string
  status: number
  constructor(code: string, status: number) {
    super(code)
    this.name = 'KindleError'
    this.code = code
    this.status = status
  }
}

function parseError(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    if ('error' in payload && payload.error && typeof payload.error === 'object') {
      const err = payload.error as { code?: unknown }
      if (typeof err.code === 'string') {
        return err.code
      }
    }
    if ('error' in payload && typeof payload.error === 'string') {
      return payload.error
    }
  }
  return 'UNKNOWN_ERROR'
}

export async function fetchDeviceInfo(): Promise<DeviceInfo> {
  const response = await fetch(`${API_BASE_URL}/kindle/info`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new KindleError(parseError(payload), response.status)
  }

  return response.json()
}
