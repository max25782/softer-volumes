import type { Metadata } from 'next'
import { Reveal, Eyebrow } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Terms of service placeholder.',
}

export default function TermsPage() {
  return (
    <section className="section max-w-3xl mx-auto">
      <Reveal>
        <Eyebrow>Legal</Eyebrow>
        <h1
          className="font-display font-light leading-tight mt-2 mb-8"
          style={{ fontSize: 'clamp(36px, 4vw, 48px)' }}
        >
          Terms of service
        </h1>
        <p className="text-caption text-mist leading-relaxed space-y-4">
          This is placeholder content. Replace with proper terms covering digital guide purchases,
          refunds, and acceptable use before launch.
        </p>
      </Reveal>
    </section>
  )
}
