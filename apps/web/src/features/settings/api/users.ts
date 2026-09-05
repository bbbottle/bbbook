import { get, post, remove } from '../../../shared/api/client.js'

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

export function listUsers(): Promise<User[]> {
  return get('/admin/users')
}

export function createUser(request: CreateUserRequest): Promise<User> {
  return post('/admin/users', request)
}

export function deleteUser(userId: string): Promise<{ success: true }> {
  return remove(`/admin/users/${encodeURIComponent(userId)}`)
}
