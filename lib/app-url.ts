function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function getAppBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL

  if (configuredUrl !== undefined && configuredUrl.trim() !== '') {
    return trimTrailingSlash(configuredUrl)
  }

  if (process.env.VERCEL_URL !== undefined && process.env.VERCEL_URL.trim() !== '') {
    return `https://${trimTrailingSlash(process.env.VERCEL_URL)}`
  }

  return 'http://localhost:3000'
}
