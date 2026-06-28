function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return withoutTrailingSlash(process.env.NEXT_PUBLIC_APP_URL)
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${withoutTrailingSlash(process.env.VERCEL_PROJECT_PRODUCTION_URL)}`
  }

  if (process.env.VERCEL_URL) {
    return `https://${withoutTrailingSlash(process.env.VERCEL_URL)}`
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL must be set in production')
  }

  return 'http://localhost:3000'
}
