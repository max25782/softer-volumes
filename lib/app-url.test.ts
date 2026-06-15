import { afterEach, describe, expect, it } from 'vitest'
import { getAppBaseUrl } from './app-url'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('getAppBaseUrl', () => {
  it('uses the configured public app URL without a trailing slash', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://softer.example/'
    process.env.APP_URL = 'https://internal.example'
    process.env.VERCEL_URL = 'preview.vercel.app'

    expect(getAppBaseUrl()).toBe('https://softer.example')
  })

  it('falls back to APP_URL and then VERCEL_URL', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    process.env.APP_URL = 'https://app.example/'
    process.env.VERCEL_URL = 'preview.vercel.app'

    expect(getAppBaseUrl()).toBe('https://app.example')

    delete process.env.APP_URL
    expect(getAppBaseUrl()).toBe('https://preview.vercel.app')
  })

  it('uses localhost only when no deployment URL is configured', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.APP_URL
    delete process.env.VERCEL_URL

    expect(getAppBaseUrl()).toBe('http://localhost:3000')
  })
})
