'use client'

import { cn } from '@/lib/utils'
import { useInView } from 'react-intersection-observer'
import { useEffect, useRef } from 'react'

// ── Reveal animation wrapper ──────────────────────────────
interface RevealProps {
  children: React.ReactNode
  className?: string
  delay?: 0 | 1 | 2 | 3 | 4 | 5
  as?: React.ElementType
}

export function Reveal({ children, className, delay = 0, as: Tag = 'div' }: RevealProps) {
  const { ref, inView } = useInView({ threshold: 0.12, triggerOnce: true })
  const delayClass = delay > 0 ? `reveal-delay-${delay}` : ''

  return (
    <Tag
      ref={ref}
      className={cn('reveal', inView && 'in-view', delayClass, className)}
    >
      {children}
    </Tag>
  )
}

// ── Section eyebrow ───────────────────────────────────────
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn('text-eyebrow text-gold mb-4', className)}>
      {children}
    </p>
  )
}

// ── Ornament divider ──────────────────────────────────────
export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn('ornament my-8', className)}>
      <div className="ornament-diamond" />
    </div>
  )
}

// ── Price range dots ──────────────────────────────────────
export function PriceRange({ range }: { range?: 1 | 2 | 3 | 4 }) {
  if (!range) return null
  return (
    <span className="text-[9px] tracking-[0.1em] text-gold/60 font-sans">
      {'$'.repeat(range)}
    </span>
  )
}

// ── Category badge ────────────────────────────────────────
import { categoryConfig } from '@/lib/utils'
import type { GuideCategory } from '@/lib/types'

export function CategoryBadge({
  category,
  size = 'sm',
}: {
  category: GuideCategory
  size?: 'sm' | 'md'
}) {
  const config = categoryConfig[category]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        'font-sans font-normal tracking-[0.2em] uppercase',
        'border border-gold/20 text-gold',
        size === 'sm' ? 'text-[8px] px-2 py-1' : 'text-[9px] px-3 py-1.5'
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

// ── Loading skeleton ──────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gold/10 rounded-sm',
        className
      )}
    />
  )
}

// ── Gold divider line ─────────────────────────────────────
export function GoldLine({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-px w-full', className)}
      style={{ background: 'linear-gradient(to right, transparent, var(--gold-dim), transparent)' }}
    />
  )
}
