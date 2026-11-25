import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true })
const production = process.env.NODE_ENV === 'production'
const origin = new URL(process.env.APP_ORIGIN || 'http://127.0.0.1:4175').origin
if (production && !process.env.DATABASE_URL) throw new Error('Cần cấu hình DATABASE_URL.')

export const settings = {
  production,
  origin,
  port: Number(process.env.PORT || 4000),
  mediaBaseUrl: process.env.MEDIA_BASE_URL || '',
  trustProxy: process.env.TRUST_PROXY === '1',
  serveFrontend: process.env.SERVE_FRONTEND === '1'
}
export const db = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'postgresql://nihongo:nihongo_dev@127.0.0.1:55432/nihongo'
})

export function mediaUrl(value) {
  if (!value || !settings.mediaBaseUrl || !value.startsWith('/media/')) return value
  return new URL(value.slice('/media/'.length), settings.mediaBaseUrl.replace(/\/?$/, '/')).href
}

