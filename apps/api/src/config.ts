import { mkdirSync } from 'node:fs'

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const STORAGE_PATH = process.env.STORAGE_PATH ?? '/storage/bbbook'
export const KINDLE_SSH_CMD = process.env.KINDLE_SSH_CMD ?? 'ssh kindle'
export const API_PORT = process.env.API_PORT ?? '80'
export const WEB_DIST_PATH = './apps/web/dist'

export const AUTH_JWT_SECRET = requireEnv('AUTH_JWT_SECRET')
export const AUTH_TOTP_ISSUER = process.env.AUTH_TOTP_ISSUER ?? 'bbbook'
export const AUTH_USERS_FILE = process.env.AUTH_USERS_FILE ?? `${STORAGE_PATH}/users.json`
export const AUTH_TOTP_SECRET_KEY = process.env.AUTH_TOTP_SECRET_KEY
export const AUTH_SEED_USERS = process.env.AUTH_SEED_USERS
export const AUTH_DEFAULT_ADMIN_PASSWORD = process.env.AUTH_DEFAULT_ADMIN_PASSWORD

try {
  mkdirSync(STORAGE_PATH, { recursive: true })
} catch {
  // ignore existing directory or permission errors
}
