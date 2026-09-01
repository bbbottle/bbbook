import type { Context, MiddlewareHandler } from 'hono'

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 60

const store = new Map<string, Array<number>>()

const getClientIp = (c: Context): string => {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    const [first] = forwarded.split(',')
    if (first) return first.trim()
  }
  return c.req.header('x-real-ip') ?? 'unknown'
}

export const kindleRateLimiter: MiddlewareHandler = async (c, next) => {
  const ip = getClientIp(c)
  const now = Date.now()
  const windowStart = now - WINDOW_MS

  const previous = store.get(ip) ?? []
  const timestamps = previous.filter((t) => t > windowStart)

  if (timestamps.length >= MAX_REQUESTS) {
    const resetAt = timestamps[0] + WINDOW_MS
    const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000))
    c.header('Retry-After', String(retryAfter))
    return c.json({ error: 'Too Many Requests' }, 429)
  }

  timestamps.push(now)
  store.set(ip, timestamps)
  await next()
}
