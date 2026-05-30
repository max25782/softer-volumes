function normalizeUrl(value: string): string {
  return value.startsWith('http://') || value.startsWith('https://')
    ? value.replace(/\/$/, '')
    : `https://${value.replace(/\/$/, '')}`
}

export function getAppBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL

  if (configuredUrl !== undefined && configuredUrl.trim() !== '') {
    return normalizeUrl(configuredUrl.trim())
  }

  return 'http://localhost:3000'
}
