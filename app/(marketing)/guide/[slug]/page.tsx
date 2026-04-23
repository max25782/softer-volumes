import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MOCK_GUIDES, formatPrice } from '@/lib/utils'
import { Reveal, Eyebrow, Ornament } from '@/components/ui'
import { CheckoutButton } from '@/components/guide/CheckoutButton'
import type { Guide } from '@/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = MOCK_GUIDES.find((g) => g.slug === slug)
  if (!guide) return {}
  return {
    title: `${guide.title} City Guide`,
    description: guide.description,
  }
}

export async function generateStaticParams() {
  return MOCK_GUIDES.map((g) => ({ slug: g.slug }))
}

const features = [
  { icon: '📍', title: '100+ Handpicked Places', desc: 'Cafés, restaurants, bars, hotels, shops and cultural spaces — every one visited personally.' },
  { icon: '🗺', title: 'Interactive Map', desc: 'Custom-styled Mapbox map. Filter by category and district. Navigate like a local from day one.' },
  { icon: '📸', title: 'Original Photography', desc: 'Personal photos from each venue. Not stock. Not press shots. Real visits, real atmosphere.' },
  { icon: '💬', title: 'Personal Notes', desc: 'A personal note on every place — what to order, when to go, what makes it special.' },
  { icon: '🔗', title: 'Direct Links', desc: 'Tap straight to Instagram, reservations, and Google Maps from inside the guide.' },
  { icon: '♾', title: 'Lifetime Access', desc: 'Buy once. Access forever. New places added as they are discovered — included at no extra cost.' },
]

const categories = [
  { icon: '☕', name: 'Cafés & Coffee' },
  { icon: '🍽', name: 'Restaurants' },
  { icon: '🍸', name: 'Bars & Nightlife' },
  { icon: '🏯', name: 'Hotels & Stays' },
  { icon: '🛍', name: 'Shops & Boutiques' },
  { icon: '🎨', name: 'Art & Culture' },
]

export default async function GuideLandingPage({ params }: Props) {
  const { slug } = await params
  const guide = MOCK_GUIDES.find((g) => g.slug === slug) as Guide | undefined
  if (!guide) notFound()

  return (
    <div className="bg-paper">

      {/* ── HERO ── */}
      <section className="min-h-screen grid grid-cols-1 md:grid-cols-2 overflow-hidden">

        {/* Left — content */}
        <div className="flex flex-col justify-end px-6 md:px-16 pb-16 pt-32 relative z-10 bg-paper">
          <Reveal>
            <Eyebrow>City Guide — Digital</Eyebrow>
          </Reveal>

          <Reveal delay={1}>
            <h1
              className="font-display font-light leading-[0.92] tracking-tight mt-2"
              style={{ fontSize: 'clamp(72px, 9vw, 130px)' }}
            >
              {guide.title}
            </h1>
            <p className="font-korean text-2xl text-mist mt-3 tracking-[0.1em]">
              {guide.tagline}
            </p>
          </Reveal>

          {/* Stats row */}
          <Reveal delay={2}>
            <div className="flex gap-10 mt-16 pt-10 border-t border-gold/20">
              {[
                { num: `${guide.placeCount}+`, label: 'Places' },
                { num: '6',                    label: 'Categories' },
                { num: '1',                    label: 'Custom Map' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-4xl font-light text-ink leading-none">
                    {s.num}
                  </p>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-mist mt-1">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* CTA */}
          <Reveal delay={3} className="mt-10">
            <CheckoutButton guide={guide} />
          </Reveal>
        </div>

        {/* Right — hero image */}
        <div className="relative hidden md:block overflow-hidden min-h-[600px]">
          <div className="absolute inset-0">
            <Image
              src={guide.heroImage}
              alt={guide.title}
              fill
              priority
              className="object-cover img-sepia"
              sizes="(min-width: 768px) 50vw, 0px"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(244,239,229,0.4) 0%, transparent 60%)',
            }}
          />

          {/* Price bubble */}
          <div className="absolute bottom-14 left-[-48px] bg-ink text-paper p-8 z-10">
            <p className="text-[9px] tracking-[0.3em] uppercase text-mist mb-2">
              One-time purchase
            </p>
            <p className="font-display text-6xl font-light text-gold leading-none">
              {formatPrice(guide.price, guide.currency)}
            </p>
            <p className="text-[9px] tracking-[0.2em] uppercase text-mist/50 mt-2">
              Lifetime access · Instant unlock
            </p>
          </div>
        </div>
      </section>

      {/* ── DESCRIPTION ── */}
      <section className="section bg-warm grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <Reveal>
          <Eyebrow>About This Guide</Eyebrow>
          <h2
            className="font-display font-light leading-tight mt-2 mb-6"
            style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}
          >
            Not a list.<br />
            <em className="text-gold">A lived perspective.</em>
          </h2>
          <p className="font-display text-xl font-light leading-[1.75] text-charcoal">
            {guide.description}
          </p>
          <Ornament />
          <p className="text-caption text-mist leading-relaxed">
            Every place in this guide was visited personally. No sponsored listings. No partnerships. Just the places worth your time.
          </p>
        </Reveal>

        {/* Categories grid */}
        <Reveal delay={2}>
          <div className="grid grid-cols-2 gap-px bg-gold/10">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="bg-warm px-6 py-8 flex items-center gap-4 hover:bg-gold/5 transition-colors duration-200"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-display text-lg font-normal text-ink">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── FEATURES ── */}
      <section className="section bg-paper">
        <Reveal className="text-center mb-16">
          <Eyebrow>What's Inside</Eyebrow>
          <h2
            className="font-display font-light"
            style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}
          >
            Everything you need.<br />
            <em className="text-gold">Nothing you don't.</em>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gold/10">
          {features.map((f, i) => (
            <Reveal
              key={f.title}
              delay={(i % 3) as 0 | 1 | 2}
              className="bg-paper px-8 py-10 hover:bg-warm transition-colors duration-200"
            >
              <span className="text-3xl block mb-5">{f.icon}</span>
              <h3 className="font-display text-2xl font-normal text-ink mb-3">
                {f.title}
              </h3>
              <p className="text-caption text-mist leading-relaxed">
                {f.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── PURCHASE CTA ── */}
      <section className="section bg-ink text-paper grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <Reveal>
          <Eyebrow>Unlock {guide.title}</Eyebrow>
          <h2
            className="font-display font-light leading-tight mt-2 mb-6"
            style={{ fontSize: 'clamp(44px, 5vw, 72px)' }}
          >
            {guide.title},<br />
            <em className="text-gold">fully unlocked</em>
          </h2>
          <p className="font-display text-xl font-light italic leading-[1.7] text-mist max-w-md">
            One purchase. Every recommendation, mapped, photographed, and linked — ready the moment you land.
          </p>
        </Reveal>

        {/* Purchase card */}
        <Reveal delay={2}>
          <div className="border border-gold/25 p-12 relative">
            <div className="absolute -top-3 left-10 bg-ink px-4">
              <span className="text-eyebrow text-gold">Digital Guide</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-10">
              <span className="font-display text-2xl font-light text-gold mt-2">
                {guide.currency.toUpperCase()}
              </span>
              <span className="font-display text-8xl font-light text-paper leading-none">
                {guide.price / 100}
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-mist/40 self-end mb-3">
                one-time
              </span>
            </div>

            {/* Includes */}
            <ul className="flex flex-col gap-4 mb-10 pb-10 border-b border-gold/15">
              {[
                `${guide.placeCount}+ handpicked places`,
                'Interactive Mapbox map',
                'Personal notes on every place',
                'Direct links to book & reserve',
                'Lifetime access — buy once',
                'Updates included forever',
              ].map((item) => (
                <li key={item} className="flex items-center gap-4 text-caption text-paper/70">
                  <span className="w-5 h-px bg-gold flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <CheckoutButton guide={guide} variant="gold" />
          </div>
        </Reveal>
      </section>
    </div>
  )
}
