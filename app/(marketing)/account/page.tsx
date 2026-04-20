import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Reveal, Eyebrow } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Account',
  description: 'Sign in or manage your guides.',
}

export default async function AccountPage() {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <section className="section max-w-xl mx-auto text-center">
      <Reveal>
        <Eyebrow>Account</Eyebrow>
        <h1
          className="font-display font-light leading-tight mt-2 mb-6"
          style={{ fontSize: 'clamp(36px, 4vw, 48px)' }}
        >
          Your guides,<br />
          <em className="text-gold">in one place</em>
        </h1>
        <p className="text-caption text-mist leading-relaxed mb-10">
          Sign in to access purchased city guides and your dashboard.
        </p>
        <Link href="/auth/signin?callbackUrl=/dashboard" className="btn-primary inline-flex">
          <span>Sign in</span>
          <span>→</span>
        </Link>
      </Reveal>
    </section>
  )
}
