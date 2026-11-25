import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { ZodError } from 'zod'
import { fileURLToPath } from 'node:url'
import { db, settings } from './config.mjs'
import { HttpError, send } from './utils.mjs'
import { catalogRoutes } from './routes/catalog.mjs'

const app = express()
app.disable('x-powered-by')
if (settings.trustProxy) app.set('trust proxy', 1)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: {
    directives: { 'img-src': ["'self'", 'data:', 'https:'], 'media-src': ["'self'", 'https:'] }
  }
}))
app.use('/api', cors({ origin: settings.origin, methods: ['GET', 'HEAD'] }))
app.use('/api', rateLimit({
  windowMs: 60_000, limit: 350, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' } }
}))
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
app.get('/api/health', async (req, res) => {
  try {
    await db.$queryRaw`SELECT 1`
    send(res, { status: 'ok', database: 'connected' })
  } catch {
    throw new HttpError(503, 'Chưa kết nối được cơ sở dữ liệu.')
  }
})
app.use('/api/catalog', catalogRoutes)
if (settings.serveFrontend) {
  const frontend = fileURLToPath(new URL('../../fe/dist/', import.meta.url))
  const index = fileURLToPath(new URL('../../fe/dist/index.html', import.meta.url))
  app.use(express.static(frontend))
  app.get(/^(?!\/api(?:\/|$))\/(?:[^.]*?)$/, (req, res) => res.sendFile(index))
}
app.use((req, res) => res.status(404).json({ error: { message: 'Không tìm thấy đường dẫn.' } }))
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  let status = 500
  let message = 'Có lỗi xảy ra. Vui lòng thử lại.'
  let fields
  if (error instanceof HttpError) ({ status, message } = error)
  else if (error instanceof ZodError) {
    status = 400
    message = 'Dữ liệu chưa hợp lệ.'
    fields = error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message }))
  }
  if (status >= 500) console.error(req.method, req.path, error.code || error.name)
  res.status(status).json({ error: { message, fields } })
})
export default app

