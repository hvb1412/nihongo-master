import EmbeddedPostgres from 'embedded-postgres'
import { mkdir, access, writeFile, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pg from 'pg'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { setTimeout as sleep } from 'node:timers/promises'

const port = Number(process.env.LOCAL_PG_PORT || 55432)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('LOCAL_PG_PORT chưa hợp lệ.')
const directory = fileURLToPath(new URL('../.local/postgres-' + port, import.meta.url))
await mkdir(path.dirname(directory), { recursive: true })
const user = 'nihongo'
const password = 'nihongo_dev'
const initialized = await access(path.join(directory, 'PG_VERSION')).then(() => true, () => false)
const connection = { host: '127.0.0.1', port, user, password, database: 'postgres', connectionTimeoutMillis: 1500 }
const exec = promisify(execFile)

async function startWindows() {
  const binaries = await import('@embedded-postgres/windows-x64')
  if (!initialized) {
    const secretFile = path.join(path.dirname(directory), 'pg-password-' + port)
    await writeFile(secretFile, password + '\n', { mode: 0o600 })
    try {
      await exec(binaries.initdb, ['-D', directory, '-U', user, '--auth=scram-sha-256', '--locale=C', '--encoding=UTF8', '--pwfile=' + secretFile])
    } finally {
      await unlink(secretFile)
    }
  }
  const child = spawn(binaries.postgres, ['-D', directory, '-p', String(port), '-h', '127.0.0.1'], { stdio: 'inherit', windowsHide: true })
  child.on('error', error => console.error(error.message))
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null || !child.pid) throw new Error('PostgreSQL không khởi động được. Kiểm tra cổng và thư mục dữ liệu.')
    const client = new pg.Client(connection)
    try {
      await client.connect()
      return async () => {
        if (child.exitCode === null) {
          await exec(binaries.pg_ctl, ['stop', '-D', directory, '-m', 'fast']).catch(() => child.kill())
        }
      }
    } catch {
      await sleep(150)
    } finally {
      await client.end()
    }
  }
  child.kill()
  throw new Error('PostgreSQL không sẵn sàng.')
}

async function startUnix() {
  const postgres = new EmbeddedPostgres({
    databaseDir: directory, user, password, port, persistent: true, authMethod: 'scram-sha-256',
    postgresFlags: ['-h', '127.0.0.1']
  })
  if (!initialized) await postgres.initialise()
  await postgres.start()
  return () => postgres.stop()
}

const stop = await (process.platform === 'win32' ? startWindows() : startUnix())
try {
  const client = new pg.Client(connection)
  await client.connect()
  try {
    const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = 'nihongo'")
    if (!existing.rowCount) await client.query('CREATE DATABASE nihongo')
  } finally {
    await client.end()
  }
  console.log('PostgreSQL đang chạy tại 127.0.0.1:' + port)
  await new Promise(resolve => {
    process.once('SIGINT', resolve)
    process.once('SIGTERM', resolve)
  })
} finally {
  await stop()
}

