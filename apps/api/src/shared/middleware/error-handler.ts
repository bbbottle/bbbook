import { Cause, Exit } from 'effect'
import type { Context, ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { KindleUnavailableError } from '../schema/errors.js'

const statusByTag: Record<string, ContentfulStatusCode> = {
  InvalidRequestError: 400,
  TotpNotConfiguredError: 400,
  TotpAlreadyEnabledError: 400,
  InvalidCredentialError: 401,
  InvalidTempTokenError: 401,
  InvalidTotpTokenError: 401,
  InvalidBackupCodeError: 401,
  UserNotFoundError: 404,
  RateLimitedError: 429,
  KindleUnavailableError: 503,
}

const defaultStatus = 500

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

  if (status === 429 && errors.length > 0) {
    const retryAfter = (errors[0] as { retryAfter?: number }).retryAfter
    if (typeof retryAfter === 'number') {
      c.header('Retry-After', String(retryAfter))
    }
  }

  return c.json({ error: message }, status as ContentfulStatusCode)
}

export const errorHandler: ErrorHandler = (err, c) => {
  const tag = (err as { _tag?: string })._tag
  if (tag && statusByTag[tag] !== undefined) {
    const status = statusByTag[tag]!
    if (status === 429) {
      const retryAfter = (err as { retryAfter?: number }).retryAfter
      if (typeof retryAfter === 'number') {
        c.header('Retry-After', String(retryAfter))
      }
    }
    return c.json({ error: err instanceof Error ? err.message : String(err) }, status as ContentfulStatusCode)
  }

  if (err instanceof KindleUnavailableError) {
    return c.json({ error: err.message }, 503 as ContentfulStatusCode)
  }

  return c.json({ error: err instanceof Error ? err.message : String(err) }, 500 as ContentfulStatusCode)
}
