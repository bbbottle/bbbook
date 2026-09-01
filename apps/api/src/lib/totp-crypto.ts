import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { AUTH_TOTP_SECRET_KEY } from '../config.js'
import { logger } from './logger.js'

const ENCRYPTED_PREFIX = 'enc:v1:'

const asUint8Array = (buffer: Buffer): Uint8Array =>
  new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length)

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

const deriveKey = (key: string): Uint8Array | null => {
  try {
    const decoded = Buffer.from(key, 'base64')
    if (decoded.length === 32) {
      return asUint8Array(decoded)
    }
  } catch {
    // ignore base64 decode errors and fall back to hashing
  }
  if (key.length === 32) {
    return asUint8Array(Buffer.from(key, 'utf8'))
  }
  return asUint8Array(createHash('sha256').update(key).digest())
}

const encryptionKey = AUTH_TOTP_SECRET_KEY ? deriveKey(AUTH_TOTP_SECRET_KEY) : null
const encryptionEnabled = encryptionKey !== null

if (AUTH_TOTP_SECRET_KEY && !encryptionEnabled) {
  logger.warn(
    'AUTH_TOTP_SECRET_KEY is set but could not be derived into a 32-byte key. TOTP secrets will be stored in plaintext.'
  )
} else if (!AUTH_TOTP_SECRET_KEY) {
  logger.warn(
    'AUTH_TOTP_SECRET_KEY is not configured. TOTP secrets will be stored in plaintext. Configure a 32-byte base64 key or any string for production.'
  )
}

export const encryptSecret = (plaintext: string): string => {
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

export const decryptSecret = (value: string): string => {
  if (!value.startsWith(ENCRYPTED_PREFIX)) return value
  if (!encryptionEnabled || !encryptionKey) {
    throw new Error('Encrypted TOTP secret found but AUTH_TOTP_SECRET_KEY is not configured or invalid')
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
