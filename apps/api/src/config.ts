import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

export const STORAGE_PATH = process.env.STORAGE_PATH ?? '/storage/bbbook'

try {
  mkdirSync(STORAGE_PATH, { recursive: true })
} catch {
  // ignore existing directory or permission errors
}

export const AUTH_DB_FILE = process.env.AUTH_DB_FILE ?? join(STORAGE_PATH, 'bbbook.db')

const rawJwtSecret = process.env.AUTH_JWT_SECRET ?? ''
if (rawJwtSecret.length === 0) {
  console.warn('AUTH_JWT_SECRET is not set; using an insecure development secret')
}
export const AUTH_JWT_SECRET = rawJwtSecret.length > 0 ? rawJwtSecret : 'dev-insecure-secret-please-set-AUTH_JWT_SECRET'

export const AUTH_TOTP_ISSUER = process.env.AUTH_TOTP_ISSUER ?? 'bbbook'
export const AUTH_TOTP_SECRET_KEY = process.env.AUTH_TOTP_SECRET_KEY

export interface SeedUser {
  readonly username: string
  readonly password: string
}

export const AUTH_SEED_USERS = ((): ReadonlyArray<SeedUser> => {
  const raw = process.env.AUTH_SEED_USERS
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((u) => typeof u?.username === 'string' && typeof u?.password === 'string')
  } catch {
    return []
  }
})()

export const API_PORT = Number(process.env.API_PORT ?? '80')
export const KINDLE_SSH_CMD = process.env.KINDLE_SSH_CMD ?? 'ssh kindle'
