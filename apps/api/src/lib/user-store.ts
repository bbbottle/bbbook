import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Effect, Option, Semaphore } from 'effect'
import bcrypt from 'bcryptjs'
import {
  AUTH_DEFAULT_ADMIN_PASSWORD,
  AUTH_SEED_USERS,
  AUTH_TOTP_SECRET_KEY,
  AUTH_USERS_FILE,
  STORAGE_PATH,
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

const ENCRYPTED_PREFIX = 'enc:v1:'

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
  logger.error(
    'AUTH_TOTP_SECRET_KEY is not configured with a valid 32-byte base64 key. TOTP secrets will be stored in plaintext. This is a security TODO: configure AUTH_TOTP_SECRET_KEY for production deployments.'
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

const isEncrypted = (value: string): boolean => value.startsWith(ENCRYPTED_PREFIX)

const encrypt = (plaintext: string): string => {
  if (!encryptionEnabled || !encryptionKey) return plaintext
  const iv = asUint8Array(randomBytes(12))
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv)
  const update = asUint8Array(cipher.update(plaintext, 'utf8'))
  const final = asUint8Array(cipher.final())
  const authTag = asUint8Array(cipher.getAuthTag())
  const ciphertext = concatUint8Arrays([update, final])
  const combined = concatUint8Arrays([iv, authTag, ciphertext])
  return `${ENCRYPTED_PREFIX}${Buffer.from(combined).toString('base64')}`
}

const decrypt = (value: string): string => {
  if (!isEncrypted(value)) return value
  if (!encryptionEnabled || !encryptionKey) {
    throw new Error('Encrypted TOTP secret found but AUTH_TOTP_SECRET_KEY is not configured or is invalid')
  }
  try {
    const buffer = asUint8Array(Buffer.from(value.slice(ENCRYPTED_PREFIX.length), 'base64'))
    if (buffer.length < 28) throw new Error('Invalid encrypted secret length')
    const iv = buffer.subarray(0, 12)
    const authTag = buffer.subarray(12, 28)
    const encrypted = buffer.subarray(28)
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv)
    decipher.setAuthTag(authTag)
    const update = asUint8Array(decipher.update(encrypted))
    const final = asUint8Array(decipher.final())
    const plaintext = concatUint8Arrays([update, final])
    return new TextDecoder().decode(plaintext)
  } catch (cause) {
    throw new Error('Failed to decrypt TOTP secret. The encryption key may have changed.', { cause })
  }
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

const parseRecord = (record: UserRecord) =>
  Effect.try({
    try: () => fromRecord(record),
    catch: (cause) => new UserStoreError({ message: 'Failed to decrypt user record', cause }),
  })

const fileLock = Semaphore.makeUnsafe(1)

const withFileLock = <A, E>(effect: Effect.Effect<A, E, never>): Effect.Effect<A, E, never> =>
  fileLock.withPermit(effect)

const doReadRecords = Effect.fn('UserStore.doReadRecords')(function*() {
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

  return parsed as UserRecord[]
})

const doSave = Effect.fn('UserStore.doSave')(function*(users: ReadonlyArray<User>, tempPath: string) {
  const records = users.map(toRecord)
  const data = JSON.stringify(records, null, 2)
  const dir = dirname(AUTH_USERS_FILE)

  yield* Effect.try({
    try: () => mkdirSync(dir, { recursive: true }),
    catch: (cause) => new UserStoreError({ message: 'Failed to create users file directory', cause }),
  })

  yield* Effect.tryPromise({
    try: () => writeFile(tempPath, data, 'utf8'),
    catch: (cause) => new UserStoreError({ message: 'Failed to write users file', cause }),
  })

  yield* Effect.tryPromise({
    try: () => rename(tempPath, AUTH_USERS_FILE),
    catch: (cause) => new UserStoreError({ message: 'Failed to commit users file', cause }),
  })
})

const seedLocked = Effect.fn('UserStore.seedLocked')(function*() {
  return yield* withFileLock(
    Effect.gen(function*() {
      if (existsSync(AUTH_USERS_FILE)) {
        const records = yield* doReadRecords()
        return yield* Effect.forEach(records, (record) => parseRecord(record))
      }

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
        const passwordFile = `${STORAGE_PATH}/.admin-password`
        yield* Effect.try({
          try: () => mkdirSync(STORAGE_PATH, { recursive: true }),
          catch: (cause) => new UserStoreError({ message: 'Failed to create storage directory', cause }),
        })
        yield* Effect.tryPromise({
          try: () => writeFile(passwordFile, randomPassword, { mode: 0o600 }),
          catch: (cause) => new UserStoreError({ message: 'Failed to write default admin password file', cause }),
        })
        logger.warn(
          `No AUTH_SEED_USERS or AUTH_DEFAULT_ADMIN_PASSWORD provided. A random admin password was generated and written to ${passwordFile}`
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

      const tempPath = `${AUTH_USERS_FILE}.${randomUUID()}.tmp`
      yield* doSave(users, tempPath)
      return users
    })
  )
})

export const loadUsers = Effect.fn('UserStore.loadUsers')(function*() {
  const exists = yield* Effect.sync(() => existsSync(AUTH_USERS_FILE))

  if (!exists) {
    return yield* seedLocked()
  }

  return yield* withFileLock(
    Effect.gen(function*() {
      const records = yield* doReadRecords()
      const needsEncryption =
        encryptionEnabled && records.some((record) => record.totpSecret !== null && !isEncrypted(record.totpSecret))
      const users = yield* Effect.forEach(records, (record) => parseRecord(record))
      if (needsEncryption) {
        const tempPath = `${AUTH_USERS_FILE}.${randomUUID()}.tmp`
        yield* doSave(users, tempPath)
      }
      return users
    })
  )
})

export const updateUsers = <A, E>(
  update: (users: ReadonlyArray<User>) => Effect.Effect<{ users: ReadonlyArray<User>; result: A }, E, never>
): Effect.Effect<A, E | UserStoreError, never> =>
  withFileLock(
    Effect.gen(function*() {
      const records = yield* doReadRecords()
      const users = yield* Effect.forEach(records, (record) => parseRecord(record))
      const { users: updated, result } = yield* update(users)
      const tempPath = `${AUTH_USERS_FILE}.${randomUUID()}.tmp`
      yield* doSave(updated, tempPath)
      return result
    })
  )
