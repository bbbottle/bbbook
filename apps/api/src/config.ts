import { mkdirSync } from 'node:fs'

export const STORAGE_PATH = process.env.STORAGE_PATH ?? '/storage/bbbook'
export const KINDLE_SSH_CMD = process.env.KINDLE_SSH_CMD ?? 'ssh kindle'
export const API_PORT = process.env.API_PORT ?? '80'
export const WEB_DIST_PATH = './apps/web/dist'

try {
  mkdirSync(STORAGE_PATH, { recursive: true })
} catch {
  // ignore existing directory or permission errors
}
