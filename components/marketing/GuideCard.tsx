'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatPrice } from '@/lib/utils'
import type { Guide } from '@/lib/types'

interface GuideCardProps {
  guide: Guide
  index?: number
  isPurchased?: boolean
}

export function GuideCard({ guide, index = 0, isPurchased = false }: GuideCardProps) {
  return (
    <motion.article
      className="relative"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.9,
        delay: index * 0.1,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <Link href={isPurchased ? `/guides/${guide.slug}` : `/guide/${guide.slug}`}>
        <div className="group relative overflow-hidden card-hover">

          {/* Image */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <div className="absolute inset-0">
              <Image
                src={guide.coverImage}
                alt={guide.title}
                fill
                className="object-cover img-sepia transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            </div>

            {/* Overlay gradient */}
            <div
              className="absolute inset-0 transition-opacity duration-500"
              style={{
                background: 'linear-gradient(to top, rgba(10,9,6,0.7) 0%, transparent 60%)',
              }}
            />

            {/* Tagline overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="font-korean text-2xl font-light text-paper/50 leading-none mb-1">
                {guide.tagline}
              </p>
              <h2 className="font-display text-4xl font-light text-paper leading-none">
                {guide.title}
              </h2>
            </div>

            {/* Purchased badge */}
            {isPurchased && (
              <div className="absolute top-4 right-4 bg-gold text-ink text-[8px] tracking-[0.25em] uppercase px-2 py-1">
                Unlocked
              </div>
            )}
          </div>

          {/* Card body */}
          <div className="pt-5 pb-2 border-b border-gold/15">
            <p className="text-[10px] leading-relaxed tracking-wide text-mist line-clamp-2 mb-4">
              {guide.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[9px] tracking-[0.3em] uppercase text-mist/60">
                  {guide.placeCount}+ Places
                </span>
              </div>
              <span className="font-display text-2xl font-light text-gold">
                {isPurchased ? 'Open →' : formatPrice(guide.price, guide.currency)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

// ── Guides Grid ───────────────────────────────────────────
import { MOCK_GUIDES } from '@/lib/utils'

export function GuidesGrid({ purchasedIds = [] }: { purchasedIds?: string[] }) {
  return (
    <section id="guides" className="section bg-warm">
      <div className="mb-16">
        <p className="text-eyebrow mb-4">The Collection</p>
        <h2 className="font-display font-light leading-tight"
          style={{ fontSize: 'clamp(36px, 4.5vw, 64px)' }}>
          Every city,<br />
          <em className="text-gold">personally curated</em>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {MOCK_GUIDES.map((guide, i) => (
          <GuideCard
            key={guide.id}
            guide={guide as Guide}
            index={i}
            isPurchased={purchasedIds.includes(guide.id)}
          />
        ))}
      </div>
    </section>
  )
}
