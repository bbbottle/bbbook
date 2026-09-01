import { Hono } from 'hono'

const router = new Hono()

router.get('/up', (c) => c.text('ok'))
router.get('/health', (c) => c.json({ status: 'ok' }))

export const createHealthRouter = () => router
