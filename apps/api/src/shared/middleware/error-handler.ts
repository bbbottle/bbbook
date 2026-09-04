import { Cause, Exit } from 'effect'
import type { Context, ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import type { ErrorCode } from '@bbbook/shared-types'

const statusByTag: Record<string, ContentfulStatusCode> = {
  InvalidRequestError: 400,
  TotpNotConfiguredError: 400,
  TotpAlreadyEnabledError: 400,
  UsernameTakenError: 400,
  InvalidCredentialError: 401,
  InvalidTempTokenError: 401,
  InvalidTotpTokenError: 401,
  InvalidBackupCodeError: 401,
  UserNotFoundError: 404,
  RateLimitedError: 429,
  QueueFullError: 503,
  KindleSnapshotPendingError: 503,
  KindleUnavailableError: 503,
}

const codeByTag: Record<string, ErrorCode> = {
  InvalidRequestError: 'INVALID_REQUEST_BODY',
  InvalidCredentialError: 'INVALID_CREDENTIALS',
  InvalidTempTokenError: 'INVALID_CREDENTIALS',
  InvalidTotpTokenError: 'INVALID_OTP',
  TotpNotConfiguredError: 'TOTP_NOT_CONFIGURED',
  TotpAlreadyEnabledError: 'TOTP_ALREADY_ENABLED',
  UserNotFoundError: 'USER_NOT_FOUND',
  UsernameTakenError: 'USERNAME_TAKEN',
  InvalidBackupCodeError: 'INVALID_BACKUP_CODE',
  RateLimitedError: 'RATE_LIMITED',
  QueueFullError: 'QUEUE_FULL',
  KindleSnapshotPendingError: 'DEVICE_INITIALIZING',
  KindleUnavailableError: 'DEVICE_UNAVAILABLE',
}

const defaultStatus = 500

const retryAfterFromError = (error: unknown): number | undefined => {
  const e = error as { retryAfter?: number; _tag?: string; queueSize?: number }
  if (typeof e.retryAfter === 'number') return e.retryAfter
  if (e._tag === 'QueueFullError' && typeof e.queueSize === 'number') {
    return Math.max(1, Math.ceil(e.queueSize / 10))
  }
  return undefined
}

const statusFromErrors = (errors: ReadonlyArray<{ _tag?: string }>): number => {
  for (const e of errors) {
    if (e._tag && statusByTag[e._tag] !== undefined) {
      return statusByTag[e._tag]!
    }
  }
  return defaultStatus
}

export const handleExit = <A, E = never>(
  exit: Exit.Exit<A, E>,
  c: Context,
  onSuccess: (value: A) => Response | Promise<Response>
): Response | Promise<Response> => {
  if (Exit.isSuccess(exit)) {
    return onSuccess(exit.value)
  }

  const errors = Cause.prettyErrors(exit.cause) as ReadonlyArray<{ _tag?: string }>
  const status = statusFromErrors(errors)
  const tag = errors[0]?._tag
  const code = (tag ? codeByTag[tag] : undefined) ?? 'UNKNOWN_ERROR'
  const retryAfter = errors[0] ? retryAfterFromError(errors[0]) : undefined

  if ((status === 429 || status === 503) && retryAfter !== undefined) {
    c.header('Retry-After', String(retryAfter))
  }

  const response: { error: { code: ErrorCode; retryAfter?: number } } = { error: { code } }
  if (retryAfter !== undefined) {
    response.error.retryAfter = retryAfter
  }

  return c.json(response, status as ContentfulStatusCode)
}

export const errorHandler: ErrorHandler = (err, c) => {
  const tag = (err as { _tag?: string })._tag
  const status = (tag && statusByTag[tag]) ?? defaultStatus
  const code = (tag ? codeByTag[tag] : undefined) ?? 'UNKNOWN_ERROR'
  const retryAfter = retryAfterFromError(err)

  if ((status === 429 || status === 503) && retryAfter !== undefined) {
    c.header('Retry-After', String(retryAfter))
  }

  const response: { error: { code: ErrorCode; retryAfter?: number } } = { error: { code } }
  if (retryAfter !== undefined) {
    response.error.retryAfter = retryAfter
  }

  return c.json(response, status as ContentfulStatusCode)
}
