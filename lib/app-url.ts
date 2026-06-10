function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getAppBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL
  if (configuredUrl !== undefined && configuredUrl !== '') return stripTrailingSlash(configuredUrl)

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl !== undefined && vercelUrl !== '') return `https://${stripTrailingSlash(vercelUrl)}`

  return 'http://localhost:3000'
}
