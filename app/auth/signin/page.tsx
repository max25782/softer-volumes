import type { Metadata } from 'next'
import { signIn } from '@/lib/auth'
import { Reveal } from '@/components/ui'

export const metadata: Metadata = { title: 'Sign In' }

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Reveal className="text-center mb-16">
          <p className="font-display text-[11px] tracking-[0.4em] uppercase text-mist mb-6">
            BRAND NAME
          </p>
          <h1
            className="font-display font-light"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}
          >
            Welcome<br />
            <em className="text-gold">back</em>
          </h1>
          <p className="text-caption text-mist mt-4">
            Sign in to access your city guides
          </p>
        </Reveal>

        <Reveal delay={1} className="flex flex-col gap-3">

          {/* Google */}
          <form action={async () => {
            'use server'
            await signIn('google', { redirectTo: callbackUrl ?? '/dashboard' })
          }}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-4 px-6 py-4 border border-gold/20 text-ink font-sans text-[10px] tracking-[0.25em] uppercase hover:border-gold hover:bg-gold/5 transition-all duration-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Apple */}
          <form action={async () => {
            'use server'
            await signIn('apple', { redirectTo: callbackUrl ?? '/dashboard' })
          }}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-ink text-paper font-sans text-[10px] tracking-[0.25em] uppercase hover:bg-charcoal transition-colors duration-300"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </button>
          </form>

          {/*
            Magic link (Resend) requires PrismaAdapter (or another DB adapter) in lib/auth.ts.
            Uncomment Resend in providers and adapter, then restore the email form here.
          */}
        </Reveal>

        <Reveal delay={2} className="mt-10 text-center">
          <p className="text-[9px] tracking-[0.1em] text-mist/40 leading-relaxed max-w-xs mx-auto">
            By signing in you agree to our Terms of Service and Privacy Policy.
          </p>
        </Reveal>
      </div>
    </div>
  )
}
