'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <section className="relative min-h-screen grid grid-cols-1 md:grid-cols-2 overflow-hidden">

      {/* LEFT — Text */}
      <div className="relative z-10 flex flex-col justify-end px-6 md:px-16 pb-16 md:pb-20 pt-32 bg-paper">

        <motion.p
          className="text-eyebrow text-gold mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          Personal City Guides
        </motion.p>

        <motion.h1
          className="font-display font-light leading-[0.92] tracking-tight"
          style={{ fontSize: 'clamp(64px, 8vw, 120px)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          Asia,<br />
          <em className="text-gold not-italic">curated.</em>
        </motion.h1>

        <motion.p
          className="font-korean text-sm text-mist mt-4 tracking-[0.1em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
        >
          서울 · 東京 · กรุงเทพ · ᬩᬮᬶ
        </motion.p>

        {/* Stats */}
        <motion.div
          className="flex gap-10 mt-16 pt-10 border-t border-gold/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.1 }}
        >
          {[
            { num: '4',    label: 'City Guides'     },
            { num: '400+', label: 'Curated Places'  },
            { num: '$100', label: 'Per Guide'        },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <span className="font-display text-4xl font-light text-ink leading-none">
                {stat.num}
              </span>
              <span className="text-[9px] tracking-[0.3em] uppercase text-mist">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.3 }}
        >
          <Link href="/#guides" className="btn-primary mt-12 inline-flex">
            <span>Explore Guides</span>
            <span className="transition-transform duration-300 group-hover:translate-x-2">→</span>
          </Link>
        </motion.div>
      </div>

      {/* RIGHT — Image */}
      <div className="relative hidden md:block overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: 'easeOut' }}
        >
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=1200&q=85"
              alt="Seoul, Korea"
              fill
              priority
              className="object-cover img-sepia"
              sizes="(min-width: 768px) 50vw, 0px"
            />
          </div>
        </motion.div>

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(244,239,229,0.35) 0%, transparent 60%)',
          }}
        />

        {/* Price tag */}
        <motion.div
          className="absolute bottom-14 left-[-48px] bg-ink text-paper p-7 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <p className="text-[9px] tracking-[0.3em] uppercase text-mist mb-2">
            Starting from
          </p>
          <p className="font-display text-5xl font-light text-gold leading-none">
            $100
          </p>
          <p className="text-[9px] tracking-[0.2em] uppercase text-mist/50 mt-1">
            Lifetime access
          </p>
        </motion.div>
      </div>
    </section>
  )
}
