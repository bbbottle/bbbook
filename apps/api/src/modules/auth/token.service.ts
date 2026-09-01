import { jwtVerify, SignJWT } from 'jose'
import { Context, Effect, Layer } from 'effect'
import { AUTH_JWT_SECRET } from '../../config.js'
import { InvalidToken } from './errors.js'

const encoder = new TextEncoder()
const secret = encoder.encode(AUTH_JWT_SECRET)

export interface TokenPayload {
  readonly userId: string
  readonly username: string
  readonly type: 'mfa' | 'access'
}

export class TokenService extends Context.Service<TokenService, {
  issueMfaToken(userId: string, username: string): Effect.Effect<string, InvalidToken>
  issueAccessToken(userId: string, username: string): Effect.Effect<string, InvalidToken>
  verifyMfaToken(token: string): Effect.Effect<TokenPayload, InvalidToken>
  verifyAccessToken(token: string): Effect.Effect<TokenPayload, InvalidToken>
}>()('auth/TokenService') {
  static readonly layer = Layer.effect(TokenService, Effect.sync(() => {
    const issue = (userId: string, username: string, type: 'mfa' | 'access', expiration: string) =>
      Effect.tryPromise({
        try: async () =>
          await new SignJWT({ userId, username, type })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(expiration)
            .sign(secret),
        catch: () => new InvalidToken()
      })

    const issueMfaToken = (userId: string, username: string) =>
      issue(userId, username, 'mfa', '5m')

    const issueAccessToken = (userId: string, username: string) =>
      issue(userId, username, 'access', '24h')

    const verify = (token: string, expectedType: 'mfa' | 'access') =>
      Effect.tryPromise({
        try: async () => {
          const { payload } = await jwtVerify(token, secret)
          if (
            payload.userId == null ||
            payload.username == null ||
            payload.type !== expectedType ||
            typeof payload.userId !== 'string' ||
            typeof payload.username !== 'string'
          ) {
            throw new InvalidToken()
          }
          return {
            userId: payload.userId,
            username: payload.username,
            type: payload.type
          } as TokenPayload
        },
        catch: () => new InvalidToken()
      })

    const verifyMfaToken = (token: string) => verify(token, 'mfa')
    const verifyAccessToken = (token: string) => verify(token, 'access')

    return TokenService.of({
      issueMfaToken,
      issueAccessToken,
      verifyMfaToken,
      verifyAccessToken
    })
  }))
}
