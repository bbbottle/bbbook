import { Effect, type ManagedRuntime, Option } from 'effect'
import { getCookie } from 'hono/cookie'
import type { MiddlewareHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { InvalidTempTokenError } from '../../modules/auth/errors.js'
import { TokenService } from '../../modules/auth/token.service.js'
import { UserRepository } from '../../modules/auth/user.repository.js'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    role: 'admin' | 'user'
  }
}

export const createAuthMiddleware = (
  runtime: ManagedRuntime.ManagedRuntime<TokenService | UserRepository, unknown>
): MiddlewareHandler =>
  async (c, next) => {
    const authHeader = c.req.header('authorization')
    const cookieToken = getCookie(c, 'session')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

    if (!token) {
      return c.json({ error: { code: 'UNAUTHORIZED' } }, 401 as ContentfulStatusCode)
    }

    try {
      const session = await runtime.runPromise(
        Effect.gen(function* () {
          const userId = yield* TokenService.use((s) => s.verifySessionToken(token))
          const maybeUser = yield* UserRepository.use((repo) => repo.findById(userId))
          if (Option.isNone(maybeUser)) {
            return yield* new InvalidTempTokenError({ message: 'User not found' })
          }
          return { userId, role: maybeUser.value.role }
        })
      )
      c.set('userId', session.userId)
      c.set('role', session.role)
      await next()
    } catch (error) {
      if (error instanceof InvalidTempTokenError) {
        return c.json({ error: { code: 'UNAUTHORIZED' } }, 401 as ContentfulStatusCode)
      }
      throw error
    }
  }

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const role = c.get('role')
  if (role !== 'admin') {
    return c.json({ error: { code: 'FORBIDDEN' } }, 403 as ContentfulStatusCode)
  }
  await next()
}
