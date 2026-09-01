import { DateTime, Effect } from 'effect'
import { RateLimitedError } from '../modules/auth/errors.js'

const MAX_FAILURES = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

const store = new Map<string, { failures: number; lockedUntil: number }>()

export const RateLimiter = {
  check: Effect.fn('RateLimiter.check')(function*(username: string) {
    const now = DateTime.toEpochMillis(yield* DateTime.now)
    const entry = store.get(username)
    if (entry && entry.lockedUntil > now) {
      const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000)
      return yield* new RateLimitedError({
        message: `Too many failed attempts. Try again in ${retryAfter}s.`,
        retryAfter,
      })
    }
  }),

  recordFailure: Effect.fn('RateLimiter.recordFailure')(function*(username: string) {
    const now = DateTime.toEpochMillis(yield* DateTime.now)
    const entry = store.get(username)
    if (!entry) {
      store.set(username, { failures: 1, lockedUntil: 0 })
      return
    }
    const failures = entry.failures + 1
    const lockedUntil = failures >= MAX_FAILURES ? now + LOCK_DURATION_MS : entry.lockedUntil
    store.set(username, { failures, lockedUntil })
  }),

  recordSuccess: Effect.fn('RateLimiter.recordSuccess')(function*(username: string) {
    store.delete(username)
  }),
}
