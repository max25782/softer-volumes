export function getAppOrigin(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)

  if (configuredUrl) return new URL(configuredUrl).origin
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000'

  throw new Error('NEXT_PUBLIC_APP_URL must be set')
}
