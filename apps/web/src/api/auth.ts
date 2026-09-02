import { type LocalePreference } from '@bbbook/shared-types'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''

const SESSION_KEY = 'bbbook_session'
const SESSION_COOKIE = 'session'
const SESSION_SCHEMA_VERSION = 1

let cachedSessionToken: string | null | undefined = undefined

function parseSessionToken(value: string): string | null {
  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value) as { version?: unknown; token?: unknown }
      if (
        parsed.version === SESSION_SCHEMA_VERSION &&
        typeof parsed.token === 'string'
      ) {
        return parsed.token
      }
      return null
    } catch {
      return value
    }
  }
  return value
}

function readStoredSessionToken(): string | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      const token = parseSessionToken(stored)
      if (token) return token
    }
  } catch {
    // ignore storage failures in restricted contexts
  }
  return parseCookie(SESSION_COOKIE)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => {
    cachedSessionToken = undefined
  })
}

export interface LoginRequest {
  username: string
  password?: string
  token?: string
}

export interface LoginResponse {
  stage: 'setup' | 'verify' | 'authed'
  tempToken?: string
  sessionToken?: string
}

export interface TotpSetupRequest {
  tempToken: string
}

export interface TotpSetupResponse {
  secret: string
  uri: string
  qrCodeDataUrl: string
}

export interface TotpConfirmRequest {
  tempToken: string
  secret: string
  token: string
}

export interface TotpConfirmResponse {
  backupCodes: string[]
}

export interface TotpVerifyRequest {
  tempToken: string
  token: string
}

export interface TotpVerifyResponse {
  sessionToken: string
}

export interface BackupCodeRequest {
  tempToken: string
  code: string
}

export interface BackupCodeResponse {
  sessionToken: string
}

export interface CurrentUser {
  id: string
  username: string
  role: 'admin' | 'user'
}

export interface UserPreference {
  locale: LocalePreference
}

export class AuthError extends Error {
  status: number
  code: string
  retryAfter?: number
  constructor(code: string, status: number, retryAfter?: number) {
    super(code)
    this.name = 'AuthError'
    this.code = code
    this.status = status
    this.retryAfter = retryAfter
  }
}

interface ApiErrorPayload {
  code: string
  retryAfter?: number
}

function parseError(payload: unknown): ApiErrorPayload {
  if (payload && typeof payload === 'object') {
    if ('error' in payload && payload.error && typeof payload.error === 'object') {
      const err = payload.error as { code?: unknown; retryAfter?: unknown }
      if (typeof err.code === 'string') {
        return {
          code: err.code,
          retryAfter: typeof err.retryAfter === 'number' ? err.retryAfter : undefined,
        }
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
    const retryAfter = response.status === 429 ? parseRetryAfter(response.headers.get('retry-after')) : error.retryAfter
    throw new AuthError(error.code, response.status, retryAfter)
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

async function put<T>(path: string, body: unknown): Promise<T> {
  return request(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  })
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return get('/auth/me')
}

export function fetchUserPreference(): Promise<UserPreference> {
  return get('/auth/me/preferences')
}

export function updateUserPreference(request: UserPreference): Promise<void> {
  return put('/auth/me/preferences', request)
}

export function login(request: LoginRequest): Promise<LoginResponse> {
  return post('/auth/login', request)
}

export function totpSetup(request: TotpSetupRequest): Promise<TotpSetupResponse> {
  return post('/auth/totp/setup', request)
}

export function totpConfirm(request: TotpConfirmRequest): Promise<TotpConfirmResponse> {
  return post('/auth/totp/confirm', request)
}

export function totpVerify(request: TotpVerifyRequest): Promise<TotpVerifyResponse> {
  return post('/auth/totp/verify', request)
}

export function backupCode(request: BackupCodeRequest): Promise<BackupCodeResponse> {
  return post('/auth/backup-code', request)
}

export function setSessionToken(token: string) {
  cachedSessionToken = token
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ version: SESSION_SCHEMA_VERSION, token })
    )
  } catch {
    // ignore storage failures in restricted contexts
  }
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax`
}

export function getSessionToken(): string | null {
  if (cachedSessionToken !== undefined) {
    return cachedSessionToken
  }
  return (cachedSessionToken = readStoredSessionToken())
}

export function clearSessionToken() {
  cachedSessionToken = null
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore storage failures in restricted contexts
  }
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function isAuthenticated(): boolean {
  return getSessionToken() !== null
}

export function getAuthHeaders(): Record<string, string> {
  const token = getSessionToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function parseCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  if (!match) return null
  return decodeURIComponent(match[2])
}
