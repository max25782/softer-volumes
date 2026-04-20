import type { Metadata } from 'next'
import { Reveal, Eyebrow } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch.',
}

export default function ContactPage() {
  return (
    <section className="section max-w-xl mx-auto">
      <Reveal>
        <Eyebrow>Contact</Eyebrow>
        <h1
          className="font-display font-light leading-tight mt-2 mb-8"
          style={{ fontSize: 'clamp(36px, 4vw, 48px)' }}
        >
          Let&apos;s talk
        </h1>
        <p className="text-caption text-mist leading-relaxed mb-6">
          Add a form, email address, or social links here. Placeholder copy only.
        </p>
        <p className="font-display text-lg font-light text-charcoal">
          hello@yourdomain.com
        </p>
      </Reveal>
    </section>
  )
}
