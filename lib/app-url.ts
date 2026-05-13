export function getTrustedAppUrl(req: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  const baseUrl = configuredUrl ?? vercelUrl

  if (baseUrl) return baseUrl.replace(/\/+$/, '')

  if (process.env.NODE_ENV !== 'production') {
    return req.headers.get('origin') ?? 'http://localhost:3000'
  }

  throw new Error('NEXT_PUBLIC_APP_URL must be set in production')
}
