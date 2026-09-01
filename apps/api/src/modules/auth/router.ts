import { Schema } from 'effect'
import type { Effect, ManagedRuntime } from 'effect'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { Hono } from 'hono'
import { handleExit } from '../../shared/middleware/error-handler.js'
import {
  backupCode,
  confirm,
  login,
  setup,
  verify,
} from './program.js'
import {
  BackupCodeRequestSchema,
  LoginRequestSchema,
  TotpConfirmRequestSchema,
  TotpSetupRequestSchema,
  TotpVerifyRequestSchema,
} from './schema.js'
import type { TokenService } from './token.service.js'
import type { TotpService } from './totp.service.js'
import type { UserRepository } from './user.repository.js'

export const createAuthRouter = (
  runtime: ManagedRuntime.ManagedRuntime<
    TokenService | TotpService | UserRepository,
    never
  >
) => {
  const router = new Hono()

  const decodeLogin = Schema.decodeUnknownSync(LoginRequestSchema)
  const decodeTotpSetup = Schema.decodeUnknownSync(TotpSetupRequestSchema)
  const decodeTotpConfirm = Schema.decodeUnknownSync(TotpConfirmRequestSchema)
  const decodeTotpVerify = Schema.decodeUnknownSync(TotpVerifyRequestSchema)
  const decodeBackupCode = Schema.decodeUnknownSync(BackupCodeRequestSchema)

  const runAuth = async <A>(
    c: Context,
    decode: (body: unknown) => A,
    program: (request: A) => Effect.Effect<unknown, unknown, TokenService | TotpService | UserRepository>
  ) => {
    let request: A
    try {
      request = decode(await c.req.json())
    } catch {
      return c.json({ error: 'Invalid request body' }, 400 as ContentfulStatusCode)
    }
    const exit = await runtime.runPromiseExit(program(request))
    return handleExit(exit, c, (res) => c.json(res))
  }

  router.post('/login', (c) => runAuth(c, decodeLogin, login))

  router.post('/totp/setup', (c) => runAuth(c, decodeTotpSetup, setup))

  router.post('/totp/confirm', (c) => runAuth(c, decodeTotpConfirm, confirm))

  router.post('/totp/verify', (c) => runAuth(c, decodeTotpVerify, verify))

  router.post('/backup-code', (c) => runAuth(c, decodeBackupCode, backupCode))

  return router
}
