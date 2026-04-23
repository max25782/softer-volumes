'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  MARQUEE_THEMES,
  parseMarqueeTheme,
  type MarqueeThemeId,
} from '@/lib/marquee-themes'
import { cn } from '@/lib/utils'

export function Marquee() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = parseMarqueeTheme(searchParams.get('theme'))

  const applyTheme = useCallback(
    (id: MarqueeThemeId) => {
      const next = active === id ? null : id
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set('theme', next)
      else params.delete('theme')
      const qs = params.toString()
      router.replace((qs ? `/?${qs}` : '/') + '#guides', { scroll: false })
      requestAnimationFrame(() => {
        document.getElementById('guides')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    },
    [active, router, searchParams],
  )

  return (
    <div
      className="w-full overflow-hidden border-y border-gold/15 py-4 bg-warm"
      role="region"
      aria-label="Browse guides by theme"
    >
      <div
        className="flex whitespace-nowrap"
        style={{ animation: 'marquee 25s linear infinite' }}
      >
        {[0, 1].map((copy) =>
          MARQUEE_THEMES.map((theme) => {
            const isActive = active === theme.id
            return (
              <div
                key={`${copy}-${theme.id}`}
                className="inline-flex items-center gap-8 px-10"
                {...(copy === 1 ? { 'aria-hidden': true } : {})}
              >
                <span className="w-1 h-1 rounded-full bg-gold flex-shrink-0" aria-hidden />
                <button
                  type="button"
                  tabIndex={copy === 0 ? undefined : -1}
                  onClick={() => {
                    applyTheme(theme.id)
                  }}
                  aria-pressed={isActive}
                  className={cn(
                    'text-[9px] tracking-[0.35em] uppercase transition-colors rounded-full border px-3 py-1.5 -mx-1',
                    isActive
                      ? 'border-gold/60 text-gold bg-paper/90 shadow-sm'
                      : 'border-transparent text-mist hover:text-ink hover:border-gold/25',
                  )}
                >
                  {theme.label}
                </button>
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
