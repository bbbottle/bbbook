import { Cause, Exit } from 'effect'
import type { Context, ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

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
  KindleUnavailableError: 503,
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

  const errors = Cause.prettyErrors(exit.cause)
  const status = statusFromErrors(errors as ReadonlyArray<{ _tag?: string }>)
  const message = errors.map((e) => (e as Error).message || String(e)).join('\n')

  if ((status === 429 || status === 503) && errors.length > 0) {
    const retryAfter = retryAfterFromError(errors[0])
    if (retryAfter !== undefined) {
      c.header('Retry-After', String(retryAfter))
    }
  }

  return c.json({ error: message }, status as ContentfulStatusCode)
}

export const errorHandler: ErrorHandler = (err, c) => {
  const tag = (err as { _tag?: string })._tag
  if (tag && statusByTag[tag] !== undefined) {
    const status = statusByTag[tag]!
    if (status === 429 || status === 503) {
      const retryAfter = retryAfterFromError(err)
      if (retryAfter !== undefined) {
        c.header('Retry-After', String(retryAfter))
      }
    }
    return c.json({ error: err instanceof Error ? err.message : String(err) }, status as ContentfulStatusCode)
  }

  return c.json({ error: err instanceof Error ? err.message : String(err) }, 500 as ContentfulStatusCode)
}
