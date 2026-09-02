import { getAuthHeaders } from './auth.js'

export interface User {
  id: string
  username: string
  role: 'admin' | 'user'
  totpEnabled: boolean
}

export interface CreateUserRequest {
  username: string
  password: string
  role?: 'admin' | 'user'
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''

export class AdminError extends Error {
  status: number
  code: string
  constructor(code: string, status: number) {
    super(code)
    this.name = 'AdminError'
    this.code = code
    this.status = status
  }
}

interface ApiErrorPayload {
  code: string
}

function parseError(payload: unknown): ApiErrorPayload {
  if (payload && typeof payload === 'object') {
    if ('error' in payload && payload.error && typeof payload.error === 'object') {
      const err = payload.error as { code?: unknown }
      if (typeof err.code === 'string') {
        return { code: err.code }
      }
    }
    if ('error' in payload && typeof payload.error === 'string') {
      return { code: payload.error }
    }
  }
  return { code: 'UNKNOWN_ERROR' }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    const error = parseError(payload)
    throw new AdminError(error.code, response.status)
  }

  return response.json()
}

async function get<T>(path: string): Promise<T> {
  return request(path, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  })
}

export function listUsers(): Promise<User[]> {
  return get('/admin/users')
}

export function createUser(request: CreateUserRequest): Promise<User> {
  return post('/admin/users', request)
}
