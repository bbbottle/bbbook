import { Effect, Schema } from 'effect'
import { Hono } from 'hono'
import {
  BackupCodeUsed,
  InvalidCredentials,
  InvalidToken,
  InvalidTotp,
  TotpAlreadyBound,
  TotpSetupRequired,
  UserNotFound,
  type AuthError
} from './errors.js'
import {
  ConfirmRequest,
  LoginRequest,
  LoginResponse,
  SetupResponse,
  TokenResponse,
  type UserId,
  VerifyRequest
} from './schema.js'
import { TokenService } from './token.service.js'
import { TotpService } from './totp.service.js'
import { UserRepository } from './user.repository.js'

type AuthServices = UserRepository | TotpService | TokenService

interface Runtime {
  runPromise: <A, E>(
    effect: Effect.Effect<A, E, AuthServices>
  ) => Promise<A>
}

const errorStatus = (error: AuthError): number => {
  switch (error._tag) {
    case 'UserNotFound':
      return 404
    case 'InvalidCredentials':
    case 'InvalidToken':
    case 'InvalidTotp':
    case 'BackupCodeUsed':
      return 401
    case 'TotpSetupRequired':
      return 403
    case 'TotpAlreadyBound':
      return 409
    case 'InternalAuthError':
    default:
      return 500
  }
}

const errorMessage = (error: AuthError): string => {
  switch (error._tag) {
    case 'UserNotFound':
      return 'User not found'
    case 'InvalidCredentials':
      return 'Invalid credentials'
    case 'InvalidToken':
      return 'Invalid or expired token'
    case 'TotpSetupRequired':
      return 'TOTP setup required'
    case 'TotpAlreadyBound':
      return 'TOTP already bound'
    case 'InvalidTotp':
      return 'Invalid TOTP code'
    case 'BackupCodeUsed':
      return 'Backup code already used'
    case 'InternalAuthError':
    default:
      return 'Internal error'
  }
}

const bearerToken = (c: any): string | undefined => {
  const header = c.req.header('authorization')
  if (typeof header !== 'string') return undefined
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]
}

const userIdFromPayload = (userId: string): UserId => userId as UserId

const encodeLoginResponse = Schema.encodeUnknownSync(LoginResponse)
const encodeSetupResponse = Schema.encodeUnknownSync(SetupResponse)
const encodeTokenResponse = Schema.encodeUnknownSync(TokenResponse)

export const authRoutes = (runtime: Runtime) => {
  const app = new Hono()

  const runProgram = <A, E extends AuthError>(
    program: Effect.Effect<A, E, AuthServices>
  ) =>
    runtime.runPromise(
      program.pipe(
        Effect.match({
          onFailure: (error) => ({ ok: false as const, error }),
          onSuccess: (value) => ({ ok: true as const, value })
        })
      )
    )

  app.post('/login', async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ message: 'Invalid JSON body' }, 400)
    }

    let request: typeof LoginRequest.Type
    try {
      request = Schema.decodeUnknownSync(LoginRequest)(body)
    } catch {
      return c.json({ message: 'Invalid request body' }, 400)
    }

    const program = Effect.gen(function* () {
      const users = yield* UserRepository
      const tokens = yield* TokenService
      const user = yield* users.findByUsername(request.username).pipe(
        Effect.catchTag('UserNotFound', () => new InvalidCredentials())
      )
      const valid = yield* users.verifyPassword(request.password, user.passwordHash)
      if (!valid) {
        return yield* new InvalidCredentials()
      }
      const mfaToken = yield* tokens.issueMfaToken(user.id, user.username)
      return { requireTotp: user.totpEnabled, mfaToken }
    })

    const result = await runProgram(program)

    if (!result.ok) {
      return c.json({ message: errorMessage(result.error) }, errorStatus(result.error) as any)
    }

    return c.json(encodeLoginResponse(new LoginResponse(result.value)))
  })

  app.post('/setup', async (c) => {
    const token = bearerToken(c)
    if (!token) {
      return c.json({ message: 'Missing authorization header' }, 401)
    }

    const program = Effect.gen(function* () {
      const tokens = yield* TokenService
      const users = yield* UserRepository
      const totp = yield* TotpService

      const payload = yield* tokens.verifyMfaToken(token)
      const user = yield* users.findById(userIdFromPayload(payload.userId))
      if (user.totpEnabled) {
        return yield* new TotpAlreadyBound()
      }

      const setup = yield* totp.generateSetup(user.username)
      const encryptedSecret = yield* totp.encryptSecret(setup.secret)
      yield* users.setupTotp(user.id, encryptedSecret, setup.backupCodesHashed)

      return {
        secret: setup.secret,
        qrCode: setup.qrCode,
        backupCodes: setup.backupCodes
      }
    })

    const result = await runProgram(program)

    if (!result.ok) {
      return c.json({ message: errorMessage(result.error) }, errorStatus(result.error) as any)
    }

    return c.json(encodeSetupResponse(new SetupResponse(result.value)))
  })

  app.post('/confirm', async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ message: 'Invalid JSON body' }, 400)
    }

    let request: typeof ConfirmRequest.Type
    try {
      request = Schema.decodeUnknownSync(ConfirmRequest)(body)
    } catch {
      return c.json({ message: 'Invalid request body' }, 400)
    }

    const program = Effect.gen(function* () {
      const tokens = yield* TokenService
      const users = yield* UserRepository
      const totp = yield* TotpService

      const payload = yield* tokens.verifyMfaToken(request.mfaToken)
      const user = yield* users.findById(userIdFromPayload(payload.userId))

      if (user.totpSecret === null) {
        return yield* new TotpSetupRequired()
      }
      if (user.totpEnabled) {
        return yield* new TotpAlreadyBound()
      }

      const secret = yield* totp.decryptSecret(user.totpSecret)
      const valid = yield* totp.verify(secret, request.code)
      if (!valid) {
        return yield* new InvalidTotp()
      }

      const updated = yield* users.enableTotp(user.id)
      const accessToken = yield* tokens.issueAccessToken(updated.id, updated.username)
      return { accessToken }
    })

    const result = await runProgram(program)

    if (!result.ok) {
      return c.json({ message: errorMessage(result.error) }, errorStatus(result.error) as any)
    }

    return c.json(encodeTokenResponse(new TokenResponse(result.value)))
  })

  app.post('/verify', async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ message: 'Invalid JSON body' }, 400)
    }

    let request: typeof VerifyRequest.Type
    try {
      request = Schema.decodeUnknownSync(VerifyRequest)(body)
    } catch {
      return c.json({ message: 'Invalid request body' }, 400)
    }

    const program = Effect.gen(function* () {
      const tokens = yield* TokenService
      const users = yield* UserRepository
      const totp = yield* TotpService

      const payload = yield* tokens.verifyMfaToken(request.mfaToken)
      const user = yield* users.findById(userIdFromPayload(payload.userId))

      if (!user.totpEnabled) {
        return yield* new TotpSetupRequired()
      }
      if (user.totpSecret === null) {
        return yield* new TotpSetupRequired()
      }

      const secret = yield* totp.decryptSecret(user.totpSecret)
      const validTotp = yield* totp.verify(secret, request.code)
      if (validTotp) {
        const accessToken = yield* tokens.issueAccessToken(user.id, user.username)
        return { accessToken }
      }

      const backupEntries = Array.from(user.backupCodes.entries())
      for (const [index, hash] of backupEntries) {
        const matched = yield* totp.verifyBackupCode(request.code, hash)
        if (matched && !user.backupCodesUsed[index]) {
          const updated = yield* users.markBackupCodeUsed(user.id, index)
          const accessToken = yield* tokens.issueAccessToken(updated.id, updated.username)
          return { accessToken }
        }
      }

      return yield* new InvalidTotp()
    })

    const result = await runProgram(program)

    if (!result.ok) {
      return c.json({ message: errorMessage(result.error) }, errorStatus(result.error) as any)
    }

    return c.json(encodeTokenResponse(new TokenResponse(result.value)))
  })

  return app
}
