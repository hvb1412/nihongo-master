const requestHeaders = ['accept', 'origin']
const responseHeaders = ['content-type', 'cache-control', 'ratelimit', 'ratelimit-policy', 'retry-after']

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    const origin = new URL(process.env.API_ORIGIN)
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/') {
      throw new Error('API_ORIGIN must be an HTTPS origin.')
    }
    const incoming = new URL(req.url, 'http://local.invalid')
    if (!incoming.pathname.startsWith('/api/')) return res.status(404).json({ error: { message: 'Không tìm thấy API.' } })
    if (!['GET', 'HEAD'].includes(req.method)) return res.status(404).json({ error: { message: 'Không tìm thấy đường dẫn.' } })
    const path = incoming.pathname.slice('/api/'.length).split('/').map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/')
    const url = new URL('/api/' + path, origin)
    url.search = incoming.search
    const headers = Object.fromEntries(requestHeaders.filter(name => typeof req.headers[name] === 'string').map(name => [name, req.headers[name]]))
    const response = await fetch(url, {
      method: req.method, headers, redirect: 'manual', signal: AbortSignal.timeout(20_000)
    })
    for (const name of responseHeaders) {
      const value = response.headers.get(name)
      if (value) res.setHeader(name, value)
    }
    res.statusCode = response.status
    return res.end(Buffer.from(await response.arrayBuffer()))
  } catch {
    return res.status(502).json({ error: { message: 'Máy chủ API tạm thời không khả dụng.' } })
  }
}

