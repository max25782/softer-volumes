export function getAppBaseUrl(req: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL

  if (configuredUrl) return configuredUrl.replace(/\/$/, '')
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL must be configured in production')
  }

  return new URL(req.url).origin
}
