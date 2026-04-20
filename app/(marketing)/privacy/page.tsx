import type { Metadata } from 'next'
import { Reveal, Eyebrow } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Privacy policy placeholder.',
}

export default function PrivacyPage() {
  return (
    <section className="section max-w-3xl mx-auto">
      <Reveal>
        <Eyebrow>Legal</Eyebrow>
        <h1
          className="font-display font-light leading-tight mt-2 mb-8"
          style={{ fontSize: 'clamp(36px, 4vw, 48px)' }}
        >
          Privacy policy
        </h1>
        <p className="text-caption text-mist leading-relaxed space-y-4">
          This is placeholder content. Replace with a lawyer-reviewed privacy policy before you
          collect personal data or process payments in production.
        </p>
      </Reveal>
    </section>
  )
}
