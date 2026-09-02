import { Schema } from 'effect'
import type { Effect, ManagedRuntime } from 'effect'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { MiddlewareHandler } from 'hono'
import { Hono } from 'hono'
import { handleExit } from '../../shared/middleware/error-handler.js'
import {
  backupCode,
  confirm,
  getPreferences,
  login,
  me,
  setup,
  updatePreferences,
  verify,
} from './program.js'
import {
  BackupCodeRequestSchema,
  LoginRequestSchema,
  TotpConfirmRequestSchema,
  TotpSetupRequestSchema,
  TotpVerifyRequestSchema,
  UserPreferenceRequestSchema,
} from './schema.js'
import type { TokenService } from './token.service.js'
import type { TotpService } from './totp.service.js'
import type { UserRepository } from './user.repository.js'

export const createAuthRouter = (
  runtime: ManagedRuntime.ManagedRuntime<
    TokenService | TotpService | UserRepository,
    unknown
  >,
  auth: MiddlewareHandler
) => {
  const router = new Hono()

  const decodeLogin = Schema.decodeUnknownSync(LoginRequestSchema)
  const decodeTotpSetup = Schema.decodeUnknownSync(TotpSetupRequestSchema)
  const decodeTotpConfirm = Schema.decodeUnknownSync(TotpConfirmRequestSchema)
  const decodeTotpVerify = Schema.decodeUnknownSync(TotpVerifyRequestSchema)
  const decodeBackupCode = Schema.decodeUnknownSync(BackupCodeRequestSchema)
  const decodeUserPreference = Schema.decodeUnknownSync(UserPreferenceRequestSchema)

  const runAuth = async <A>(
    c: Context,
    decode: (body: unknown) => A,
    program: (request: A) => Effect.Effect<unknown, unknown, TokenService | TotpService | UserRepository>
  ) => {
    let request: A
    try {
      request = decode(await c.req.json())
    } catch {
      return c.json({ error: { code: 'INVALID_REQUEST_BODY' } }, 400 as ContentfulStatusCode)
    }
    const exit = await runtime.runPromiseExit(program(request))
    return handleExit(exit, c, (res) => c.json(res))
  }

  router.post('/login', (c) => runAuth(c, decodeLogin, login))

  router.post('/totp/setup', (c) => runAuth(c, decodeTotpSetup, setup))

  router.post('/totp/confirm', (c) => runAuth(c, decodeTotpConfirm, confirm))

  router.post('/totp/verify', (c) => runAuth(c, decodeTotpVerify, verify))

  router.post('/backup-code', (c) => runAuth(c, decodeBackupCode, backupCode))

  router.get('/me', auth, async (c) => {
    const userId = c.get('userId')
    const exit = await runtime.runPromiseExit(me(userId))
    return handleExit(exit, c, (res) => c.json(res))
  })

  router.get('/me/preferences', auth, async (c) => {
    const userId = c.get('userId')
    const exit = await runtime.runPromiseExit(getPreferences(userId))
    return handleExit(exit, c, (res) => c.json(res))
  })

  router.put('/me/preferences', auth, async (c) => {
    const userId = c.get('userId')
    let request
    try {
      request = decodeUserPreference(await c.req.json())
    } catch {
      return c.json({ error: { code: 'INVALID_REQUEST_BODY' } }, 400 as ContentfulStatusCode)
    }
    const exit = await runtime.runPromiseExit(updatePreferences(userId, request))
    return handleExit(exit, c, () => c.json({ ok: true }))
  })

  return router
}
