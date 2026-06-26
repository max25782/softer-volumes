export function getAppBaseUrl(req?: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  const baseUrl = configuredUrl ?? req?.headers.get('origin') ?? 'http://localhost:3000'

  return baseUrl.replace(/\/+$/, '')
}
