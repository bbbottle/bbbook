import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { Schema } from 'effect'

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const requireJwtSecret = (): string => {
  const value = requireEnv('AUTH_JWT_SECRET')
  if (value.length < 32) {
    throw new Error('AUTH_JWT_SECRET must be at least 32 characters for HS256 token security')
  }
  return value
}

const parseSeedUsers = (
  raw: string | undefined
): ReadonlyArray<{ readonly username: string; readonly password: string }> | undefined => {
  if (!raw) return undefined
  const SeedUser = Schema.Array(
    Schema.Struct({
      username: Schema.String,
      password: Schema.String,
    })
  )
  try {
    const parsed = JSON.parse(raw)
    return Schema.decodeUnknownSync(SeedUser)(parsed)
  } catch (cause) {
    throw new Error(`Invalid AUTH_SEED_USERS: must be a JSON array of { username, password }`, { cause })
  }
}

export const STORAGE_PATH = process.env.STORAGE_PATH ?? '/storage/bbbook'
export const UPLOAD_PATH = `${STORAGE_PATH}/uploads`
export const BACKUP_PATH = `${STORAGE_PATH}/backups`
const parseUploadMaxSize = (): number => {
  const raw = process.env.UPLOAD_MAX_SIZE
  if (!raw) return 200 * 1024 * 1024
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('UPLOAD_MAX_SIZE must be a positive integer number of bytes')
  }
  return parsed
}

export const UPLOAD_MAX_SIZE = parseUploadMaxSize()
export const KINDLE_SSH_CMD = process.env.KINDLE_SSH_CMD ?? 'ssh kindle'
export const API_PORT = process.env.API_PORT ?? '80'
export const WEB_DIST_PATH = './apps/web/dist'

export const AUTH_JWT_SECRET = requireJwtSecret()
export const AUTH_TOTP_ISSUER = process.env.AUTH_TOTP_ISSUER ?? 'bbbook'
export const AUTH_DB_FILE = process.env.AUTH_DB_FILE ?? `${STORAGE_PATH}/bbbook.db`
export const AUTH_TOTP_SECRET_KEY = process.env.AUTH_TOTP_SECRET_KEY
export const AUTH_SEED_USERS = parseSeedUsers(process.env.AUTH_SEED_USERS)
export const AUTH_DEFAULT_ADMIN_PASSWORD = process.env.AUTH_DEFAULT_ADMIN_PASSWORD

try {
  mkdirSync(STORAGE_PATH, { recursive: true })
  mkdirSync(UPLOAD_PATH, { recursive: true })
  mkdirSync(BACKUP_PATH, { recursive: true })
} catch {
  // ignore existing directory or permission errors
}

const ensureParentDir = (filePath: string) => {
  if (!filePath || filePath === ':memory:' || filePath.startsWith('file:')) return
  try {
    mkdirSync(dirname(filePath), { recursive: true })
  } catch {
    // ignore existing directory or permission errors
  }
}

ensureParentDir(AUTH_DB_FILE)

const parseSyncInterval = (): number => {
  const raw = process.env.KINDLE_SYNC_INTERVAL_MS
  if (!raw) return 15 * 60 * 1000
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? 15 * 60 * 1000 : Math.max(0, parsed)
}

export const KINDLE_SYNC_INTERVAL_MS = parseSyncInterval()
