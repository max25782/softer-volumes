export function getAppBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL !== undefined ? `https://${process.env.VERCEL_URL}` : undefined)

  return configuredUrl?.replace(/\/+$/, '') ?? 'http://localhost:3000'
}
