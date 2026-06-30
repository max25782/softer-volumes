export function getAppOrigin(req: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  if (configuredUrl) return new URL(configuredUrl).origin

  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}`).origin

  return new URL(req.url).origin
}
