export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''

const SESSION_KEY = 'bbbook_session'
const SESSION_COOKIE = 'session'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  stage: 'setup' | 'verify'
  tempToken: string
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

class AuthError extends Error {
  status: number
  retryAfter?: number
  constructor(message: string, status: number, retryAfter?: number) {
    super(message)
    this.name = 'AuthError'
    this.status = status
    this.retryAfter = retryAfter
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({} as { error?: string }))
    const message = payload.error || `Request failed with status ${response.status}`
    const retryAfter = response.status === 429 ? parseRetryAfter(response.headers.get('retry-after')) : undefined
    throw new AuthError(message, response.status, retryAfter)
  }

  return response.json()
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
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
  try {
    localStorage.setItem(SESSION_KEY, token)
  } catch {
    // ignore storage failures in restricted contexts
  }
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax`
}

export function getSessionToken(): string | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) return stored
  } catch {
    // ignore
  }
  return parseCookie(SESSION_COOKIE)
}

export function clearSessionToken() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
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
