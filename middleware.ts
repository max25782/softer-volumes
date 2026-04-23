import { auth } from '@/lib/auth'
import {
  mergeSupabaseCookiesIntoResponse,
  updateSession,
} from '@/utils/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth(async (req) => {
  const supabaseResponse = await updateSession(req as NextRequest)

  const { nextUrl, auth: session } = req as {
    nextUrl: URL
    auth: { user?: unknown } | null
  }
  const isLoggedIn = !!session?.user

  const isAppRoute =
    nextUrl.pathname.startsWith('/guides') ||
    nextUrl.pathname.startsWith('/dashboard')

  if (isAppRoute && !isLoggedIn) {
    const signInUrl = new URL('/auth/signin', nextUrl.origin)
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    const redirectResponse = NextResponse.redirect(signInUrl)
    return mergeSupabaseCookiesIntoResponse(supabaseResponse, redirectResponse)
  }

  const isAdmin =
    nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/api/admin')

  if (isAdmin) {
    const u = (session as { user?: { role?: string } } | null)?.user
    const role = u?.role
    if (!isLoggedIn || (role !== 'admin' && role !== 'superadmin')) {
      const go = new URL(
        isLoggedIn ? '/' : '/auth/signin',
        nextUrl.origin,
      )
      if (!isLoggedIn) {
        go.searchParams.set('callbackUrl', nextUrl.pathname)
      }
      return mergeSupabaseCookiesIntoResponse(supabaseResponse, NextResponse.redirect(go))
    }
  }

  return supabaseResponse
})

export const config = {
  matcher: [
    '/guides/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
}
