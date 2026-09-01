import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Effect, Option } from 'effect'
import bcrypt from 'bcryptjs'
import {
  AUTH_DEFAULT_ADMIN_PASSWORD,
  AUTH_SEED_USERS,
  AUTH_TOTP_SECRET_KEY,
  AUTH_USERS_FILE,
} from '../config.js'
import { logger } from './logger.js'
import type { User } from '../modules/auth/schema.js'
import { UserStoreError } from '../shared/schema/errors.js'

interface UserRecord {
  readonly id: string
  readonly username: string
  readonly passwordHash: string
  readonly totpSecret: string | null
  readonly totpEnabled: boolean
  readonly backupCodes: readonly string[]
  readonly backupCodesUsed: readonly boolean[]
}

const isValidUserRecord = (value: unknown): value is UserRecord => {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.username === 'string' &&
    typeof record.passwordHash === 'string' &&
    (record.totpSecret === null || typeof record.totpSecret === 'string') &&
    typeof record.totpEnabled === 'boolean' &&
    Array.isArray(record.backupCodes) &&
    record.backupCodes.every((c) => typeof c === 'string') &&
    Array.isArray(record.backupCodesUsed) &&
    record.backupCodesUsed.every((u) => typeof u === 'boolean')
  )
}

const encryptionKey = (() => {
  if (!AUTH_TOTP_SECRET_KEY) return null
  const decoded = Buffer.from(AUTH_TOTP_SECRET_KEY, 'base64')
  if (decoded.length !== 32) {
    logger.warn(
      `AUTH_TOTP_SECRET_KEY decoded to ${decoded.length} bytes; expected 32 bytes. TOTP secrets will be stored in plaintext.`
    )
    return null
  }
  return new Uint8Array(decoded)
})()

const encryptionEnabled = encryptionKey !== null

if (!encryptionEnabled) {
  logger.warn(
    'AUTH_TOTP_SECRET_KEY is not configured. TOTP secrets will be stored in plaintext. (TODO: add encryption)'
  )
}

const asUint8Array = (buffer: Buffer): Uint8Array => new Uint8Array(buffer)

const concatUint8Arrays = (arrays: ReadonlyArray<Uint8Array>): Uint8Array => {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

const encrypt = (plaintext: string): string => {
  if (!encryptionEnabled || !encryptionKey) return plaintext
  const iv = asUint8Array(randomBytes(12))
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv)
  const update = asUint8Array(cipher.update(plaintext, 'utf8'))
  const final = asUint8Array(cipher.final())
  const authTag = asUint8Array(cipher.getAuthTag())
  const ciphertext = concatUint8Arrays([update, final])
  const combined = concatUint8Arrays([iv, authTag, ciphertext])
  return Buffer.from(combined).toString('base64')
}

const decrypt = (ciphertext: string): string => {
  if (!encryptionEnabled || !encryptionKey) return ciphertext
  const buffer = asUint8Array(Buffer.from(ciphertext, 'base64'))
  const iv = buffer.subarray(0, 12)
  const authTag = buffer.subarray(12, 28)
  const encrypted = buffer.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv)
  decipher.setAuthTag(authTag)
  const update = asUint8Array(decipher.update(encrypted))
  const final = asUint8Array(decipher.final())
  const plaintext = concatUint8Arrays([update, final])
  return new TextDecoder().decode(plaintext)
}

const toRecord = (user: User): UserRecord => ({
  id: user.id,
  username: user.username,
  passwordHash: user.passwordHash,
  totpSecret: Option.match(user.totpSecret, {
    onNone: () => null,
    onSome: (secret) => encrypt(secret),
  }),
  totpEnabled: user.totpEnabled,
  backupCodes: [...user.backupCodes],
  backupCodesUsed: [...user.backupCodesUsed],
})

const fromRecord = (record: UserRecord): User => ({
  id: record.id,
  username: record.username,
  passwordHash: record.passwordHash,
  totpSecret: record.totpSecret === null ? Option.none() : Option.some(decrypt(record.totpSecret)),
  totpEnabled: record.totpEnabled,
  backupCodes: record.backupCodes,
  backupCodesUsed: record.backupCodesUsed,
})

const seedUsers = Effect.fn('UserStore.seedUsers')(function*() {
  let seeds: Array<{ username: string; password: string }> = []

  if (AUTH_SEED_USERS) {
    const raw = AUTH_SEED_USERS
    const parsed = yield* Effect.try({
      try: () => JSON.parse(raw) as unknown,
      catch: (cause) => new UserStoreError({ message: 'AUTH_SEED_USERS is not valid JSON', cause }),
    })
    if (!Array.isArray(parsed)) {
      return yield* new UserStoreError({ message: 'AUTH_SEED_USERS must be a JSON array' })
    }
    seeds = parsed.map((item) => ({
      username: String((item as { username?: unknown }).username ?? ''),
      password: String((item as { password?: unknown }).password ?? ''),
    }))
  } else if (AUTH_DEFAULT_ADMIN_PASSWORD) {
    seeds = [{ username: 'admin', password: AUTH_DEFAULT_ADMIN_PASSWORD }]
  } else {
    const randomPassword = randomBytes(16).toString('base64')
    logger.warn(
      `No AUTH_SEED_USERS or AUTH_DEFAULT_ADMIN_PASSWORD provided. Default admin password: ${randomPassword}`
    )
    seeds = [{ username: 'admin', password: randomPassword }]
  }

  const users: User[] = []
  for (const { username, password } of seeds) {
    if (!username || !password) {
      return yield* new UserStoreError({ message: 'Seed user must have username and password' })
    }
    const passwordHash = yield* Effect.try({
      try: () => bcrypt.hashSync(password, 12),
      catch: (cause) => new UserStoreError({ message: 'Failed to hash seed password', cause }),
    })
    users.push({
      id: randomUUID(),
      username,
      passwordHash,
      totpSecret: Option.none(),
      totpEnabled: false,
      backupCodes: [],
      backupCodesUsed: [],
    })
  }

  yield* saveUsers(users)
  return users
})

export const loadUsers = Effect.fn('UserStore.loadUsers')(function*() {
  const exists = yield* Effect.sync(() => existsSync(AUTH_USERS_FILE))

  if (!exists) {
    return yield* seedUsers()
  }

  const raw = yield* Effect.tryPromise({
    try: () => readFile(AUTH_USERS_FILE, 'utf8'),
    catch: (cause) => new UserStoreError({ message: 'Failed to read users file', cause }),
  })

  const parsed = yield* Effect.try({
    try: () => JSON.parse(raw) as unknown,
    catch: (cause) => new UserStoreError({ message: 'Users file contains invalid JSON', cause }),
  })

  if (!Array.isArray(parsed) || !parsed.every(isValidUserRecord)) {
    return yield* new UserStoreError({ message: 'Users file has invalid shape' })
  }

  return (parsed as UserRecord[]).map(fromRecord)
})

export const saveUsers = Effect.fn('UserStore.saveUsers')(function*(users: ReadonlyArray<User>) {
  const records = users.map(toRecord)
  const data = JSON.stringify(records, null, 2)
  const dir = dirname(AUTH_USERS_FILE)

  yield* Effect.try({
    try: () => mkdirSync(dir, { recursive: true }),
    catch: (cause) => new UserStoreError({ message: 'Failed to create users file directory', cause }),
  })

  const tempPath = `${AUTH_USERS_FILE}.tmp`
  yield* Effect.tryPromise({
    try: () => writeFile(tempPath, data, 'utf8'),
    catch: (cause) => new UserStoreError({ message: 'Failed to write users file', cause }),
  })

  yield* Effect.tryPromise({
    try: () => rename(tempPath, AUTH_USERS_FILE),
    catch: (cause) => new UserStoreError({ message: 'Failed to commit users file', cause }),
  })
})
