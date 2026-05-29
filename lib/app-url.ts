function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '')
}

export function getAppBaseUrl(req: Request): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? process.env.AUTH_URL

  if (configuredUrl !== undefined && configuredUrl !== '') {
    return trimTrailingSlash(configuredUrl)
  }

  const origin = req.headers.get('origin')
  if (origin !== null && origin !== '') return trimTrailingSlash(origin)

  return trimTrailingSlash(new URL(req.url).origin)
}
