import type { Metadata } from 'next'
import { Reveal, Eyebrow } from '@/components/ui'

export const metadata: Metadata = {
  title: 'About',
  description: 'The story behind these city guides.',
}

export default function AboutPage() {
  return (
    <section className="section max-w-3xl mx-auto">
      <Reveal>
        <Eyebrow>About</Eyebrow>
        <h1
          className="font-display font-light leading-tight mt-2 mb-8"
          style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}
        >
          Not a travel blog.<br />
          <em className="text-gold">A lived perspective.</em>
        </h1>
        <p className="font-display text-xl font-light leading-[1.75] text-charcoal mb-6">
          These guides are written from years of living across Asia — not weekend trips or sponsored
          listings. Every place is one I would return to without hesitation.
        </p>
        <p className="text-caption text-mist leading-relaxed">
          Replace this page with your real bio, press, and story when you are ready to ship.
        </p>
      </Reveal>
    </section>
  )
}
