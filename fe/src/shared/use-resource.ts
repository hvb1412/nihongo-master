import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

const catalogCache = new Map<string, { value: unknown; expires: number }>()
const pending = new Map<string, Promise<unknown>>()

function cached(url: string) {
  const item = catalogCache.get(url)
  if (item && item.expires > Date.now()) return item
}

function loadCatalog(url: string) {
  const existing = pending.get(url)
  if (existing) return existing
  const request = api<unknown>(url).then(value => {
    catalogCache.set(url, { value, expires: Date.now() + 120_000 })
    if (catalogCache.size > 128) catalogCache.delete(catalogCache.keys().next().value!)
    return value
  }).finally(() => pending.delete(url))
  pending.set(url, request)
  return request
}

export function prefetchCatalog(url: string) {
  if (!cached(url)) void loadCatalog(url).catch(() => {})
}

export function useResource<T>(url: string | null) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<{ key?: string; data?: T; error?: string }>({})
  const key = url ? url + '|' + version : undefined
  useEffect(() => {
    if (!url || !key) return
    const controller = new AbortController()
    const catalog = url.startsWith('/catalog/')
    const item = catalog ? cached(url) : undefined
    const request = item ? Promise.resolve(item.value) : catalog ? loadCatalog(url) : api<T>(url, controller.signal)
    request.then(data => {
      if (!controller.signal.aborted) setResult({ key, data: data as T })
    }, error => {
      if (!controller.signal.aborted) setResult({ key, error: error instanceof Error && error.name === 'Error' ? error.message : 'Không thể kết nối. Hãy thử lại.' })
    })
    return () => controller.abort()
  }, [url, key])
  const reload = useCallback(() => {
    if (url) catalogCache.delete(url)
    setVersion(value => value + 1)
  }, [url])
  const data = url?.startsWith('/catalog/') ? cached(url)?.value as T | undefined : undefined
  return {
    data: data ?? (key && result.key === key ? result.data : undefined),
    error: data === undefined && key && result.key === key ? result.error : undefined,
    reload
  }
}

export function params(values: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (value !== '' && value != null) search.set(key, String(value))
  return search.size ? '?' + search : ''
}
