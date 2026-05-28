export function getAppBaseUrl(req: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '')

  return new URL(req.url).origin
}
