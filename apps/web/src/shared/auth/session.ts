import { useSyncExternalStore } from 'react'

const SESSION_KEY = 'bbbook_session'
const SESSION_COOKIE = 'session'
const SESSION_SCHEMA_VERSION = 1

let cachedSessionToken: string | null | undefined
const listeners = new Set<() => void>()

function parseSessionToken(value: string): string | null {
  if (!value.startsWith('{')) return value
  try {
    const parsed = JSON.parse(value) as { version?: unknown; token?: unknown }
    return parsed.version === SESSION_SCHEMA_VERSION &&
      typeof parsed.token === 'string'
      ? parsed.token
      : null
  } catch {
    return value
  }
}

function parseCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

function readStoredSessionToken(): string | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      const token = parseSessionToken(stored)
      if (token) return token
    }
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
  return parseCookie(SESSION_COOKIE)
}

function emitChange() {
  for (const listener of listeners) listener()
}

function handleStorage(event: StorageEvent) {
  if (event.key !== SESSION_KEY) return
  cachedSessionToken = undefined
  emitChange()
}

function subscribe(listener: () => void) {
  if (typeof window === 'undefined') return () => {}
  if (listeners.size === 0) window.addEventListener('storage', handleStorage)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0)
      window.removeEventListener('storage', handleStorage)
  }
}

export function getSessionToken(): string | null {
  if (cachedSessionToken === undefined)
    cachedSessionToken = readStoredSessionToken()
  return cachedSessionToken
}

export function useSessionToken(): string | null {
  return useSyncExternalStore(subscribe, getSessionToken, () => null)
}

export function setSessionToken(token: string) {
  cachedSessionToken = token
  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ version: SESSION_SCHEMA_VERSION, token })
    )
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax`
  }
  emitChange()
}

export function clearSessionToken() {
  cachedSessionToken = null
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
  }
  emitChange()
}

export function getAuthHeaders(): Record<string, string> {
  const token = getSessionToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
