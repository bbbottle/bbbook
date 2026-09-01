import type { MiddlewareHandler } from 'hono'

// TODO: implement authentication once requirements are provided
export const auth: MiddlewareHandler = async (_c, next) => {
  await next()
}
