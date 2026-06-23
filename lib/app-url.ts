function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

export function getAppBaseUrl(req: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL
  if (configuredUrl) return normalizeBaseUrl(configuredUrl)

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  if (vercelUrl) return normalizeBaseUrl(`https://${vercelUrl}`)

  if (process.env.NODE_ENV !== 'production') return normalizeBaseUrl(new URL(req.url).origin)

  throw new Error('NEXT_PUBLIC_APP_URL or AUTH_URL must be set')
}
