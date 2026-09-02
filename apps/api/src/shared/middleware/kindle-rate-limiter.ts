import { getConnInfo } from '@hono/node-server/conninfo'
import type { Context, MiddlewareHandler } from 'hono'

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 60
const TRUST_PROXY = process.env.TRUST_PROXY === 'true'

const store = new Map<string, Array<number>>()

const cleanupExpired = () => {
  const cutoff = Date.now() - WINDOW_MS
  for (const [ip, timestamps] of store.entries()) {
    const fresh = timestamps.filter((t) => t > cutoff)
    if (fresh.length === 0) {
      store.delete(ip)
    } else {
      store.set(ip, fresh)
    }
  }
}

const cleanupInterval = setInterval(cleanupExpired, WINDOW_MS)

process.once('exit', () => {
  clearInterval(cleanupInterval)
})

const getClientIp = (c: Context): string => {
  if (TRUST_PROXY) {
    const forwarded = c.req.header('x-forwarded-for')
    if (forwarded) {
      const [first] = forwarded.split(',')
      if (first) return first.trim()
    }
    const realIp = c.req.header('x-real-ip')
    if (realIp) return realIp.trim()
  }
  const connInfo = getConnInfo(c)
  return connInfo.remote.address ?? 'unknown'
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
    return c.json({ error: { code: 'RATE_LIMITED', retryAfter } }, 429)
  }

  timestamps.push(now)
  store.set(ip, timestamps)
  await next()
}
