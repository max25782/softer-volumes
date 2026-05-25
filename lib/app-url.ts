export function getAppBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : undefined)

  if (configuredUrl === undefined) {
    throw new Error('NEXT_PUBLIC_APP_URL must be set in production')
  }

  return new URL(configuredUrl).origin
}
