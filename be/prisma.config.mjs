import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'prisma/config'

config({ path: fileURLToPath(new URL('./.env', import.meta.url)), quiet: true })

const directUrl = process.env.DIRECT_URL
export default defineConfig({
  schema: 'prisma/schema.prisma',
  ...(directUrl ? { engine: 'classic', datasource: { url: directUrl } } : {})
})
