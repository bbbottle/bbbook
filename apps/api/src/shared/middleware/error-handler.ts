import { Cause, Exit } from 'effect'
import type { Context, ErrorHandler } from 'hono'
import { KindleUnavailableError } from '../schema/errors.js'

export const handleExit = <A, E = never>(
  exit: Exit.Exit<A, E>,
  c: Context,
  onSuccess: (value: A) => Response | Promise<Response>
): Response | Promise<Response> => {
  if (Exit.isSuccess(exit)) {
    return onSuccess(exit.value)
  }

  const errors = Cause.prettyErrors(exit.cause)
  const isKindleUnavailable = errors.some(
    (e) => (e as { _tag?: string })._tag === 'KindleUnavailableError'
  )
  const message = errors.map((e) => e.message || String(e)).join('\n')

  return c.json({ error: message }, isKindleUnavailable ? 503 : 500)
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof KindleUnavailableError) {
    return c.json({ error: err.message }, 503)
  }

  return c.json({ error: err instanceof Error ? err.message : String(err) }, 500)
}
