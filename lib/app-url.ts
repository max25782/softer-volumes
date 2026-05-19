function normalizeAppUrl(value: string | undefined): string | null {
  if (value === undefined || value.trim() === '') return null

  const candidate = value.startsWith('http') ? value : `https://${value}`

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    url.pathname = ''
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

export function getAppUrl(): string {
  const appUrl =
    normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeAppUrl(process.env.AUTH_URL) ??
    normalizeAppUrl(process.env.VERCEL_URL)

  if (appUrl !== null) return appUrl
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000'

  throw new Error('NEXT_PUBLIC_APP_URL or AUTH_URL must be set')
}
