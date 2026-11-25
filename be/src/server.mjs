import app from './app.mjs'
import { db, settings } from './config.mjs'
import { getTokenizer } from './services/furigana.mjs'

await Promise.all([db.$connect(), getTokenizer()])
const server = app.listen(settings.port, settings.production ? '0.0.0.0' : '127.0.0.1',
  () => console.log('Nihongo Master API · port ' + settings.port))
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => server.close(async () => { await db.$disconnect() }))
}

