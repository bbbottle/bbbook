import { randomBytes } from 'node:crypto'
import { Context, Effect, Layer } from 'effect'
import { Secret, TOTP } from 'otpauth'
import * as QRCode from 'qrcode'
import { AUTH_TOTP_ISSUER } from '../../config.js'
import {
  InvalidTotpTokenError,
  QrCodeError,
  TotpGenerationError,
} from './errors.js'

export class TotpService extends Context.Service<TotpService, {
  generateSecret(): Effect.Effect<string, TotpGenerationError>
  generateSetup(
    username: string,
    existingSecret?: string
  ): Effect.Effect<
    { secret: string; uri: string; qrCodeDataUrl: string },
    TotpGenerationError | QrCodeError
  >
  verify(secret: string, token: string, window?: number): Effect.Effect<void, InvalidTotpTokenError>
  generateBackupCodes(count: number): Effect.Effect<ReadonlyArray<string>, never>
}>()("@bbbook/api/modules/auth/TotpService") {}

const generateSecret = Effect.fn('TotpService.generateSecret')(function*() {
  const secret = yield* Effect.try({
    try: () => new Secret({ size: 20 }),
    catch: (cause) => new TotpGenerationError({ message: 'Failed to generate TOTP secret', cause }),
  })
  return secret.base32
})

const makeSecret = (secretBase32: string) =>
  Effect.try({
    try: () => Secret.fromBase32(secretBase32),
    catch: (cause) => new TotpGenerationError({ message: 'Invalid TOTP secret format', cause }),
  })

const makeTotp = (secret: Secret, username: string) =>
  new TOTP({
    issuer: AUTH_TOTP_ISSUER,
    label: username,
    secret,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  })

const generateSetup = Effect.fn('TotpService.generateSetup')(function*(
  username: string,
  existingSecret?: string
) {
  const secret = existingSecret
    ? yield* makeSecret(existingSecret)
    : yield* Effect.try({
        try: () => new Secret({ size: 20 }),
        catch: (cause) => new TotpGenerationError({ message: 'Failed to generate TOTP secret', cause }),
      })
  const totp = makeTotp(secret, username)
  const uri = totp.toString()
  const qrCodeDataUrl = yield* Effect.tryPromise({
    try: () => QRCode.toDataURL(uri),
    catch: (cause) => new QrCodeError({ message: 'Failed to generate QR code', cause }),
  })
  return { secret: secret.base32, uri, qrCodeDataUrl }
})

const verify = Effect.fn('TotpService.verify')(function*(
  secretBase32: string,
  token: string,
  window = 1
) {
  const secret = yield* makeSecret(secretBase32).pipe(
    Effect.catchTag('TotpGenerationError', () => new InvalidTotpTokenError({ message: 'Invalid TOTP secret' }))
  )
  const totp = makeTotp(secret, '')
  const delta = totp.validate({ token, window })
  if (delta === null) {
    return yield* new InvalidTotpTokenError({ message: 'Invalid TOTP token' })
  }
  return
})

const generateBackupCodes = Effect.fn('TotpService.generateBackupCodes')(function*(count: number) {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    codes.push(randomBytes(6).toString('base64url'))
  }
  return codes
})

export const TotpServiceLive = Layer.effect(
  TotpService,
  Effect.gen(function*() {
    return TotpService.of({
      generateSecret,
      generateSetup,
      verify,
      generateBackupCodes,
    })
  })
)
