import { Effect, Layer, Option } from 'effect'
import bcrypt from 'bcryptjs'
import { RateLimiter } from '../../lib/rate-limiter.js'
import {
  BackupCodeRequest,
  BackupCodeResponse,
  LoginRequest,
  LoginResponse,
  TotpConfirmRequest,
  TotpConfirmResponse,
  TotpSetupRequest,
  TotpSetupResponse,
  TotpVerifyRequest,
  TotpVerifyResponse,
} from './schema.js'
import { TokenService, TokenServiceLive } from './token.service.js'
import { TotpService, TotpServiceLive } from './totp.service.js'
import { UserRepository, UserRepositoryLive } from './user.repository.js'
import {
  InvalidBackupCodeError,
  InvalidCredentialError,
  InvalidTempTokenError,
  InvalidTotpTokenError,
  TotpAlreadyEnabledError,
  TotpNotConfiguredError,
  UserNotFoundError,
} from './errors.js'
import { UserStoreError } from '../../shared/schema/errors.js'

const genericLoginError = () => new InvalidCredentialError({ message: 'Invalid username or password' })

export const login = Effect.fn('AuthProgram.login')(function*(request: LoginRequest) {
  yield* RateLimiter.check(request.username)

  const userOption = yield* UserRepository.use((repo) => repo.findByUsername(request.username))
  if (Option.isNone(userOption)) {
    yield* RateLimiter.recordFailure(request.username)
    return yield* genericLoginError()
  }

  const user = userOption.value
  const valid = yield* UserRepository.use((repo) => repo.verifyPassword(user, request.password))
  if (!valid) {
    yield* RateLimiter.recordFailure(user.username)
    return yield* genericLoginError()
  }

  if (user.totpEnabled) {
    const tempToken = yield* TokenService.use((s) => s.issueTempToken(user.id, 'verify'))
    return { stage: 'verify' as const, tempToken }
  } else {
    const setupSecret = yield* TotpService.use((s) => s.generateSecret())
    const tempToken = yield* TokenService.use((s) => s.issueTempToken(user.id, 'setup', setupSecret))
    return { stage: 'setup' as const, tempToken }
  }
})

export const setup = Effect.fn('AuthProgram.setup')(function*(request: TotpSetupRequest) {
  const { userId, setupSecret } = yield* TokenService.use((s) => s.verifyTempToken(request.tempToken, 'setup'))
  const userOption = yield* UserRepository.use((repo) => repo.findById(userId))
  if (Option.isNone(userOption)) {
    return yield* new UserNotFoundError({ message: 'User not found' })
  }

  const user = userOption.value
  if (user.totpEnabled) {
    return yield* new TotpAlreadyEnabledError({ message: 'TOTP is already enabled for this account' })
  }

  return yield* TotpService.use((s) => s.generateSetup(user.username, setupSecret))
})

export const confirm = Effect.fn('AuthProgram.confirm')(function*(request: TotpConfirmRequest) {
  const { userId, setupSecret } = yield* TokenService.use((s) => s.verifyTempToken(request.tempToken, 'setup'))
  const userOption = yield* UserRepository.use((repo) => repo.findById(userId))
  if (Option.isNone(userOption)) {
    return yield* new UserNotFoundError({ message: 'User not found' })
  }

  const user = userOption.value
  if (user.totpEnabled) {
    return yield* new TotpAlreadyEnabledError({ message: 'TOTP is already enabled for this account' })
  }

  if (request.secret !== setupSecret) {
    return yield* new InvalidTempTokenError({ message: 'Setup secret mismatch' })
  }

  yield* TotpService.use((s) => s.verify(setupSecret!, request.token))

  const backupCodes = yield* TotpService.use((s) => s.generateBackupCodes(10))
  const hashedCodes: string[] = []
  for (const code of backupCodes) {
    const hash = yield* Effect.try({
      try: () => bcrypt.hashSync(code, 12),
      catch: () => new UserStoreError({ message: 'Failed to hash backup code' }),
    })
    hashedCodes.push(hash)
  }

  yield* UserRepository.use((repo) => repo.updateTotp(userId, setupSecret!, hashedCodes))

  return { backupCodes }
})

export const verify = Effect.fn('AuthProgram.verify')(function*(request: TotpVerifyRequest) {
  const { userId } = yield* TokenService.use((s) => s.verifyTempToken(request.tempToken, 'verify'))
  const userOption = yield* UserRepository.use((repo) => repo.findById(userId))
  if (Option.isNone(userOption)) {
    return yield* new UserNotFoundError({ message: 'User not found' })
  }

  const user = userOption.value
  const secret = Option.getOrUndefined(user.totpSecret)
  if (!user.totpEnabled || secret === undefined) {
    return yield* new TotpNotConfiguredError({ message: 'TOTP is not configured for this account' })
  }

  yield* RateLimiter.check(user.username)

  const verified = yield* TotpService.use((s) => s.verify(secret, request.token)).pipe(
    Effect.match({
      onFailure: () => false,
      onSuccess: () => true,
    })
  )

  if (!verified) {
    yield* RateLimiter.recordFailure(user.username)
    return yield* new InvalidTotpTokenError({ message: 'Invalid TOTP token' })
  }

  yield* RateLimiter.recordSuccess(user.username)
  const sessionToken = yield* TokenService.use((s) => s.issueSessionToken(userId))
  return { sessionToken }
})

export const backupCode = Effect.fn('AuthProgram.backupCode')(function*(request: BackupCodeRequest) {
  const { userId } = yield* TokenService.use((s) => s.verifyTempToken(request.tempToken, 'verify'))
  const userOption = yield* UserRepository.use((repo) => repo.findById(userId))
  if (Option.isNone(userOption)) {
    return yield* new UserNotFoundError({ message: 'User not found' })
  }

  const user = userOption.value
  yield* RateLimiter.check(user.username)

  const redeemedIndexOption = yield* UserRepository.use((repo) => repo.redeemBackupCode(userId, request.code))
  if (Option.isNone(redeemedIndexOption)) {
    yield* RateLimiter.recordFailure(user.username)
    return yield* new InvalidBackupCodeError({ message: 'Invalid backup code' })
  }

  yield* RateLimiter.recordSuccess(user.username)
  const sessionToken = yield* TokenService.use((s) => s.issueSessionToken(userId))
  return { sessionToken }
})

export type AuthProgramError =
  | InvalidCredentialError
  | InvalidTempTokenError
  | UserNotFoundError
  | TotpAlreadyEnabledError
  | InvalidTotpTokenError
  | TotpNotConfiguredError
  | InvalidBackupCodeError
  | UserStoreError

export const AuthServicesLive = Layer.mergeAll(TotpServiceLive, TokenServiceLive, UserRepositoryLive)
