import { getAuthHeaders } from '../auth/session.js'

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly retryAfter?: number
  ) {
    super(code)
    this.name = 'ApiError'
  }
}

interface ApiErrorPayload {
  code: string
  retryAfter?: number
}

export function parseApiError(payload: unknown): ApiErrorPayload {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = payload.error
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      return {
        code: error.code,
        retryAfter:
          'retryAfter' in error && typeof error.retryAfter === 'number'
            ? error.retryAfter
            : undefined,
      }
    }
    if (typeof error === 'string') {
      return { code: error }
    }
  }
  return { code: 'UNKNOWN_ERROR' }
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  return Number.isNaN(seconds) ? undefined : seconds
}

export async function request<T>(
  path: string,
  options: RequestInit,
  authenticated = true
): Promise<T> {
  const headers = new Headers(authenticated ? getAuthHeaders() : undefined)
  new Headers(options.headers).forEach((value, key) => headers.set(key, value))
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const error = parseApiError(payload)
    const retryAfter =
      response.status === 429
        ? parseRetryAfter(response.headers.get('retry-after'))
        : error.retryAfter
    throw new ApiError(error.code, response.status, retryAfter)
  }

  return response.json()
}

export function get<T>(path: string): Promise<T> {
  return request(path, { method: 'GET' })
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request(path, {
    method: 'POST',
    headers:
      body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function put<T>(path: string, body: unknown): Promise<T> {
  return request(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function remove<T>(path: string): Promise<T> {
  return request(path, { method: 'DELETE' })
}
