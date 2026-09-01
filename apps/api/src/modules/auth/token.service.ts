import { Context, Effect, Layer } from 'effect'
import { SignJWT, jwtVerify } from 'jose'
import { AUTH_JWT_SECRET } from '../../config.js'
import { InvalidTempTokenError } from './errors.js'

const ISSUER = 'bbbook'
const AUDIENCE = 'bbbook'

const secret = new TextEncoder().encode(AUTH_JWT_SECRET)

export class TokenService extends Context.Service<TokenService, {
  issueTempToken(userId: string, stage: 'setup' | 'verify'): Effect.Effect<string, never>
  verifyTempToken(token: string, expectedStage: 'setup' | 'verify'): Effect.Effect<string, InvalidTempTokenError>
  issueSessionToken(userId: string): Effect.Effect<string, never>
  verifySessionToken(token: string): Effect.Effect<string, InvalidTempTokenError>
}>()("@bbbook/api/modules/auth/TokenService") {}

const issueToken = (payload: Record<string, unknown>, expiration: string) =>
  Effect.tryPromise({
    try: () =>
      new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setExpirationTime(expiration)
        .sign(secret),
    catch: (cause) => new InvalidTempTokenError({ message: `Failed to issue token: ${String(cause)}` }),
  }).pipe(Effect.orDie)

const verifyToken = (token: string, expectedType: string, expectedStage?: 'setup' | 'verify') =>
  Effect.tryPromise({
    try: () =>
      jwtVerify(token, secret, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256'],
      }),
    catch: () => new InvalidTempTokenError({ message: 'Invalid or expired token' }),
  }).pipe(
    Effect.flatMap(({ payload }) => {
      if (
        payload.type !== expectedType ||
        typeof payload.sub !== 'string' ||
        (expectedStage !== undefined && payload.stage !== expectedStage)
      ) {
        return Effect.fail(new InvalidTempTokenError({ message: 'Invalid token claims' }))
      }
      return Effect.succeed(payload.sub)
    })
  )

const issueTempToken = (userId: string, stage: 'setup' | 'verify') =>
  issueToken({ type: 'temp', stage, sub: userId }, '5m')

const verifyTempToken = (token: string, expectedStage: 'setup' | 'verify') =>
  verifyToken(token, 'temp', expectedStage)

const issueSessionToken = (userId: string) => issueToken({ type: 'session', sub: userId }, '7d')

const verifySessionToken = (token: string) => verifyToken(token, 'session')

export const TokenServiceLive = Layer.effect(
  TokenService,
  Effect.gen(function*() {
    return TokenService.of({
      issueTempToken,
      verifyTempToken,
      issueSessionToken,
      verifySessionToken,
    })
  })
)
