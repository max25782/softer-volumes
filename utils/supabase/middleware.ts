import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { isSupabaseConfigured } from './env'

/**
 * Refreshes the Supabase session and returns a NextResponse carrying updated auth cookies.
 * Call from root middleware before other logic; forward Set-Cookie on redirects.
 */
export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim()
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!.trim()

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  await supabase.auth.getUser()

  return supabaseResponse
}

function forwardSetCookies(from: NextResponse, to: NextResponse) {
  const setCookies = from.headers.getSetCookie()
  for (const cookie of setCookies) {
    to.headers.append('Set-Cookie', cookie)
  }
}

export function mergeSupabaseCookiesIntoResponse(
  supabaseResponse: NextResponse,
  target: NextResponse
) {
  forwardSetCookies(supabaseResponse, target)
  return target
}
