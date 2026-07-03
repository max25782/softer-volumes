export function getAppUrl(): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL

  if (appUrl !== undefined && appUrl.trim() !== '') {
    return appUrl.replace(/\/+$/, '')
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL or APP_URL must be set in production')
  }

  return 'http://localhost:3000'
}

export function getAppUrlForPath(path: string): string {
  return `${getAppUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
