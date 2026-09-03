import { API_BASE_URL, getAuthHeaders } from './auth.js'
import type { Book } from '@bbbook/shared-types'

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

export type { Book }

export interface BooksResponse {
  books: ReadonlyArray<Book>
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

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new KindleError(parseError(payload), response.status)
  }

  return response.json()
}

export async function fetchDeviceInfo(): Promise<DeviceInfo> {
  return request('/kindle/info', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
}

export async function fetchBooks(): Promise<BooksResponse> {
  return request('/kindle/books', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
}

export async function uploadBook(
  file: File,
  onProgress?: (progress: number, status: 'uploading' | 'processing') => void
): Promise<{ success: true }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress?.(progress, progress === 100 ? 'processing' : 'uploading')
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true })
      } else {
        let payload: unknown
        try {
          payload = JSON.parse(xhr.responseText)
        } catch {
          payload = {}
        }
        reject(new KindleError(parseError(payload), xhr.status))
      }
    }

    xhr.onerror = () => reject(new KindleError('NETWORK_ERROR', 0))
    xhr.onabort = () => reject(new KindleError('UPLOAD_ABORTED', 0))

    xhr.open('POST', `${API_BASE_URL}/kindle/books`)
    const headers = getAuthHeaders()
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value))
    xhr.send(formData)
  })
}

export async function deleteBook(fileName: string): Promise<{ success: true }> {
  return request(`/kindle/books/${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
}

export async function openBook(fileName: string): Promise<{ success: true }> {
  return request(`/kindle/books/${encodeURIComponent(fileName)}/open`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
}

export async function restoreBook(fileName: string): Promise<{ success: true }> {
  return request(`/kindle/books/${encodeURIComponent(fileName)}/restore`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
}
