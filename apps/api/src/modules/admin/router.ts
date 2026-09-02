import { Schema } from 'effect'
import type { ManagedRuntime } from 'effect'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { Hono } from 'hono'
import { handleExit } from '../../shared/middleware/error-handler.js'
import type { UserRepository } from '../auth/user.repository.js'
import type { TokenService } from '../auth/token.service.js'
import { createUser, listUsers } from './program.js'
import { AdminCreateUserRequestSchema } from './schema.js'

export const createAdminRouter = (
  runtime: ManagedRuntime.ManagedRuntime<TokenService | UserRepository, unknown>
) => {
  const router = new Hono()

  const decodeCreateUser = Schema.decodeUnknownSync(AdminCreateUserRequestSchema)

  router.get('/users', async (c) => {
    const exit = await runtime.runPromiseExit(listUsers())
    return handleExit(exit, c, (res) => c.json(res))
  })

  router.post('/users', async (c: Context) => {
    let request: Schema.Schema.Type<typeof AdminCreateUserRequestSchema>
    try {
      request = decodeCreateUser(await c.req.json())
    } catch {
      return c.json({ error: { code: 'INVALID_REQUEST_BODY' } }, 400 as ContentfulStatusCode)
    }
    const exit = await runtime.runPromiseExit(createUser(request))
    return handleExit(exit, c, (res) => c.json(res))
  })

  return router
}
