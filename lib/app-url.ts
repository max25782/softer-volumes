function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getAppBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL

  if (configuredUrl !== undefined && configuredUrl.trim() !== '') {
    return stripTrailingSlash(configuredUrl.trim())
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL or APP_URL must be set in production')
  }

  return 'http://localhost:3000'
}

export function buildAppUrl(path: string): string {
  return new URL(path, `${getAppBaseUrl()}/`).toString()
}
