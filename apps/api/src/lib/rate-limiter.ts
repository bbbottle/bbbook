import { DateTime, Effect } from 'effect'
import { RateLimitedError } from '../modules/auth/errors.js'

const MAX_FAILURES = 5
const LOCK_DURATION_MS = 15 * 60 * 1000
const PRUNE_AGE_MS = 60 * 60 * 1000
const MAX_STORE_SIZE = 10000

interface Entry {
  failures: number
  lockedUntil: number
  lastFailure: number
}

const store = new Map<string, Entry>()

const pruneStore = (now: number) => {
  for (const [key, entry] of store) {
    if (entry.lockedUntil < now && entry.lastFailure < now - PRUNE_AGE_MS) {
      store.delete(key)
    }
  }
  while (store.size > MAX_STORE_SIZE) {
    let removed = false
    for (const [key, entry] of store) {
      if (entry.lockedUntil < now) {
        store.delete(key)
        removed = true
        break
      }
    }
    if (!removed) break
  }
}

export const RateLimiter = {
  check: Effect.fn('RateLimiter.check')(function*(username: string) {
    const now = DateTime.toEpochMillis(yield* DateTime.now)
    pruneStore(now)
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
      store.set(username, { failures: 1, lockedUntil: 0, lastFailure: now })
    } else {
      const failures = entry.failures + 1
      const lockedUntil = failures >= MAX_FAILURES ? now + LOCK_DURATION_MS : entry.lockedUntil
      store.set(username, { failures, lockedUntil, lastFailure: now })
    }
    pruneStore(now)
  }),

  recordSuccess: Effect.fn('RateLimiter.recordSuccess')(function*(username: string) {
    store.delete(username)
  }),
}
