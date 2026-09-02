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

class AdminError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'AdminError'
    this.status = status
  }
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({} as { error?: string }))
    const message = payload.error || `Request failed with status ${response.status}`
    throw new AdminError(message, response.status)
  }

  return response.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({} as { error?: string }))
    const message = payload.error || `Request failed with status ${response.status}`
    throw new AdminError(message, response.status)
  }

  return response.json()
}

export function listUsers(): Promise<User[]> {
  return get('/admin/users')
}

export function createUser(request: CreateUserRequest): Promise<User> {
  return post('/admin/users', request)
}
