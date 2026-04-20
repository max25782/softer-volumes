import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/marketing/HeroSection'
import { Marquee } from '@/components/marketing/Marquee'
import { GuidesGrid } from '@/components/marketing/GuideCard'
import { Testimonials } from '@/components/marketing/Testimonials'
import { Reveal } from '@/components/ui'

export const metadata: Metadata = {
  title: 'BRAND NAME — City Guides for Discerning Travellers',
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <HeroSection />

        {/* Marquee */}
        <Marquee />

        {/* Guides grid */}
        <GuidesGrid />

        {/* About / Personal brand section */}
        <section className="section bg-paper grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <p className="text-eyebrow mb-4">The Curator</p>
            <h2
              className="font-display font-light leading-tight mb-6"
              style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}
            >
              Not a travel blog.<br />
              <em className="text-gold">A lived experience.</em>
            </h2>
            <p className="font-display text-xl font-light leading-[1.7] text-charcoal mb-6">
              I've been living and working across Asia for years — Seoul, Tokyo, Bangkok, Bali. These are not places I visited. They are places I call home.
            </p>
            <p className="text-caption text-mist leading-relaxed max-w-md">
              Every place in these guides was discovered on foot, tried personally, and held to one standard: would I go back? If the answer was yes — it's in the guide.
            </p>
          </Reveal>

          <Reveal delay={2} className="relative">
            {/* Placeholder for her photo */}
            <div
              className="aspect-[3/4] bg-charcoal/10 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #e8e0d0 0%, #d4c8b8 100%)',
              }}
            >
              <div className="absolute inset-0 flex items-end p-8">
                <div>
                  <p className="font-korean text-2xl text-paper/40 mb-1">서울</p>
                  <p className="text-eyebrow text-gold">YOUR NAME HERE</p>
                </div>
              </div>
            </div>

            {/* Floating stat */}
            <div className="absolute -bottom-6 -left-6 bg-ink text-paper p-6">
              <p className="font-display text-4xl font-light text-gold leading-none mb-1">
                1M+
              </p>
              <p className="text-[9px] tracking-[0.3em] uppercase text-mist">
                Instagram Followers
              </p>
            </div>
          </Reveal>
        </section>

        {/* Testimonials */}
        <Testimonials />

        {/* Final CTA */}
        <section className="section bg-ink text-paper text-center">
          <Reveal>
            <p className="text-eyebrow mb-4">Ready?</p>
            <h2
              className="font-display font-light mb-6"
              style={{ fontSize: 'clamp(44px, 5.5vw, 80px)' }}
            >
              Choose your<br />
              <em className="text-gold">next destination</em>
            </h2>
            <p className="font-display text-xl font-light italic text-mist max-w-xl mx-auto mb-12">
              Lifetime access. Every place I love. One guide, one city.
            </p>
            <a href="/#guides" className="btn-primary inline-flex border-gold text-paper">
              <span>View All Guides</span>
              <span>→</span>
            </a>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  )
}
