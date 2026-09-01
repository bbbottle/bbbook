import { Effect } from 'effect'
import { getCookie } from 'hono/cookie'
import type { MiddlewareHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { InvalidTempTokenError } from '../../modules/auth/errors.js'
import { TokenService, TokenServiceLive } from '../../modules/auth/token.service.js'

export const auth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('authorization')
  const cookieToken = getCookie(c, 'session')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401 as ContentfulStatusCode)
  }

  try {
    const userId = await Effect.runPromise(
      TokenService.use((s) => s.verifySessionToken(token)).pipe(Effect.provide(TokenServiceLive))
    )
    c.set('userId', userId)
    await next()
  } catch (error) {
    if (error instanceof InvalidTempTokenError) {
      return c.json({ error: 'Unauthorized' }, 401 as ContentfulStatusCode)
    }
    throw error
  }
}
