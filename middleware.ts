import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req as any
  const isLoggedIn = !!session?.user

  const isAppRoute = nextUrl.pathname.startsWith('/guides') ||
                     nextUrl.pathname.startsWith('/dashboard')

  if (isAppRoute && !isLoggedIn) {
    const signInUrl = new URL('/auth/signin', nextUrl.origin)
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/guides/:path*',
    '/dashboard/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
}
