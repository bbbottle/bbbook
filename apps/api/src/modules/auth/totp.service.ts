import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Context, Effect, Layer } from 'effect'
import { Secret, TOTP } from 'otpauth'
import QRCode from 'qrcode'
import { AUTH_TOTP_ISSUER, AUTH_TOTP_SECRET_KEY } from '../../config.js'

export interface SetupResult {
  readonly secret: string
  readonly qrCode: string
  readonly backupCodes: ReadonlyArray<string>
  readonly backupCodesHashed: ReadonlyArray<string>
}

export class TotpService extends Context.Service<TotpService, {
  generateSetup(username: string): Effect.Effect<SetupResult>
  verify(secret: string, code: string): Effect.Effect<boolean>
  encryptSecret(secret: string): Effect.Effect<string>
  decryptSecret(ciphertext: string): Effect.Effect<string>
  generateBackupCodes(): Effect.Effect<{
    plain: ReadonlyArray<string>
    hashed: ReadonlyArray<string>
  }>
  verifyBackupCode(plain: string, hash: string): Effect.Effect<boolean>
}>()('auth/TotpService') {
  static readonly layer = Layer.effect(TotpService, Effect.gen(function* () {
    const generateSetup = (username: string) =>
      Effect.gen(function* () {
        const totp = new TOTP({
          issuer: AUTH_TOTP_ISSUER,
          label: username,
          secret: new Secret({ size: 20 })
        })
        const secret = totp.secret.base32
        const uri = totp.toString()
        const qrCode = yield* Effect.promise(() =>
          QRCode.toDataURL(uri, { type: 'image/png', margin: 2 })
        )
        const { plain, hashed } = yield* generateBackupCodes()
        return {
          secret,
          qrCode,
          backupCodes: plain,
          backupCodesHashed: hashed
        } as SetupResult
      })

    const verify = (secret: string, code: string) =>
      Effect.sync(
        () =>
          TOTP.validate({
            token: code,
            secret: Secret.fromBase32(secret),
            window: 1
          }) !== null
      )

    const encryptSecret = (secret: string) =>
      Effect.gen(function* () {
        if (!AUTH_TOTP_SECRET_KEY || AUTH_TOTP_SECRET_KEY.length === 0) {
          yield* Effect.logWarning(
            'TODO: TOTP secrets are stored in plaintext because AUTH_TOTP_SECRET_KEY is not configured'
          )
          return secret
        }
        const key = crypto.createHash('sha256').update(AUTH_TOTP_SECRET_KEY).digest()
        const iv = crypto.randomBytes(12)
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
        const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
        const tag = cipher.getAuthTag()
        return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
      })

    const decryptSecret = (ciphertext: string) =>
      Effect.gen(function* () {
        if (!AUTH_TOTP_SECRET_KEY || AUTH_TOTP_SECRET_KEY.length === 0) {
          return ciphertext
        }
        const key = crypto.createHash('sha256').update(AUTH_TOTP_SECRET_KEY).digest()
        const [ivB64, tagB64, dataB64] = ciphertext.split(':')
        if (!ivB64 || !tagB64 || !dataB64) {
          return ciphertext
        }
        const iv = Buffer.from(ivB64, 'base64')
        const tag = Buffer.from(tagB64, 'base64')
        const encrypted = Buffer.from(dataB64, 'base64')
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
        decipher.setAuthTag(tag)
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
      })

    const generateBackupCodes = () =>
      Effect.gen(function* () {
        const plain = Array.from({ length: 10 }, () =>
          crypto.randomBytes(4).toString('hex')
        )
        const hashed = yield* Effect.forEach(plain, (code) =>
          Effect.promise(() => bcrypt.hash(code, 12))
        )
        return { plain, hashed }
      })

    const verifyBackupCode = (plain: string, hash: string) =>
      Effect.promise(() => bcrypt.compare(plain, hash))

    return TotpService.of({
      generateSetup,
      verify,
      encryptSecret,
      decryptSecret,
      generateBackupCodes,
      verifyBackupCode
    })
  }))
}
