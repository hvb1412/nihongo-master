const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function api<T>(path: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(15_000)
  const response = await fetch(baseURL + path, {
    credentials: 'omit',
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error?.message || 'Không thể tải dữ liệu. Hãy thử lại.')
  }
  return (await response.json()).data as T
}
