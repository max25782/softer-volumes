export function getAppOrigin(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL
  if (configuredUrl) return configuredUrl
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3000'
  throw new Error('NEXT_PUBLIC_APP_URL or AUTH_URL must be set')
}
