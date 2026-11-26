const apiOrigin = process.env.API_ORIGIN?.trim()

if (!apiOrigin && !process.env.VITE_API_URL?.trim()) {
  throw new Error('Set API_ORIGIN to your Render HTTPS origin in Vercel Environment Variables.')
}

const upstream = apiOrigin ? URL.parse(apiOrigin) : null
if (apiOrigin && (!upstream || upstream.protocol !== 'https:' || upstream.username || upstream.password ||
  upstream.pathname !== '/' || upstream.search || upstream.hash)) {
  throw new Error('API_ORIGIN must be an HTTPS origin without a path, query, or fragment.')
}

export const config = {
  framework: 'vite',
  installCommand: 'npm ci --include=dev',
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  rewrites: [
    ...(upstream ? [{ source: '/api/:path*', destination: upstream.origin + '/api/:path*' }] : []),
    { source: '/((?!api(?:/|$)|assets/|audio/|fonts/|.*[.]).*)', destination: '/index.html' }
  ],
  headers: [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
      ]
    }
  ]
}
