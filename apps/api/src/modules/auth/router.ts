import { Schema } from 'effect'
import type { ManagedRuntime } from 'effect'
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

  router.post('/login', async (c) => {
    const body = await c.req.json()
    const request = decodeLogin(body)
    const exit = await runtime.runPromiseExit(login(request))
    return handleExit(exit, c, (res) => c.json(res))
  })

  router.post('/totp/setup', async (c) => {
    const body = await c.req.json()
    const request = decodeTotpSetup(body)
    const exit = await runtime.runPromiseExit(setup(request))
    return handleExit(exit, c, (res) => c.json(res))
  })

  router.post('/totp/confirm', async (c) => {
    const body = await c.req.json()
    const request = decodeTotpConfirm(body)
    const exit = await runtime.runPromiseExit(confirm(request))
    return handleExit(exit, c, (res) => c.json(res))
  })

  router.post('/totp/verify', async (c) => {
    const body = await c.req.json()
    const request = decodeTotpVerify(body)
    const exit = await runtime.runPromiseExit(verify(request))
    return handleExit(exit, c, (res) => c.json(res))
  })

  router.post('/backup-code', async (c) => {
    const body = await c.req.json()
    const request = decodeBackupCode(body)
    const exit = await runtime.runPromiseExit(backupCode(request))
    return handleExit(exit, c, (res) => c.json(res))
  })

  return router
}
