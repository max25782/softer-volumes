import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { GuideCategory } from './types'

// ── Class merging ─────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Price formatting ──────────────────────────────────────
export function formatPrice(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

// ── Category display ──────────────────────────────────────
export const categoryConfig: Record<
  GuideCategory,
  { label: string; icon: string; color: string }
> = {
  cafe:       { label: 'Cafés',        icon: '☕', color: '#b8965a' },
  restaurant: { label: 'Restaurants',  icon: '🍽', color: '#8b5e3c' },
  bar:        { label: 'Bars',         icon: '🍸', color: '#5c4a6e' },
  hotel:      { label: 'Hotels',       icon: '🏯', color: '#4a6e5c' },
  shop:       { label: 'Shops',        icon: '🛍', color: '#6e5c4a' },
  culture:    { label: 'Culture',      icon: '🎨', color: '#4a5c6e' },
  wellness:   { label: 'Wellness',     icon: '✦',  color: '#6e4a5c' },
}

// ── Price range display ───────────────────────────────────
export function formatPriceRange(range?: 1 | 2 | 3 | 4): string {
  if (!range) return ''
  return '$'.repeat(range)
}

// ── Slug helpers ──────────────────────────────────────────
export function guideTitleBySlug(slug: string): string {
  const map: Record<string, string> = {
    seoul:     'Seoul',
    tokyo:     'Tokyo',
    bangkok:   'Bangkok',
    bali:      'Bali',
    singapore: 'Singapore',
  }
  return map[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1)
}

export function guideTaglineBySlug(slug: string): string {
  const map: Record<string, string> = {
    seoul:     '서울',
    tokyo:     '東京',
    bangkok:   'กรุงเทพ',
    bali:      'ᬩᬮᬶ',
    singapore: '新加坡',
  }
  return map[slug] ?? ''
}

// ── Date formatting ───────────────────────────────────────
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

// ── Truncate text ─────────────────────────────────────────
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

// ── Mock data for development ─────────────────────────────
export const MOCK_GUIDES = [
  {
    id: '1',
    slug: 'seoul',
    title: 'Seoul',
    subtitle: 'City Guide',
    tagline: '서울',
    description: 'The city that never sleeps — and never stops surprising. From hidden hanok cafés to rooftop cocktail bars with views of Namsan Tower.',
    coverImage: 'https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=1600&q=80',
    price: 10000,
    currency: 'usd',
    isPublished: true,
    placeCount: 120,
    pageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    slug: 'tokyo',
    title: 'Tokyo',
    subtitle: 'City Guide',
    tagline: '東京',
    description: 'Precision, beauty, and a thousand hidden worlds. The city where every neighbourhood is a universe unto itself.',
    coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=80',
    price: 10000,
    currency: 'usd',
    isPublished: true,
    placeCount: 110,
    pageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    slug: 'bangkok',
    title: 'Bangkok',
    subtitle: 'City Guide',
    tagline: 'กรุงเทพ',
    description: 'Chaotic, beautiful, and deeply alive. Street food beside Michelin stars. Ancient temples between glass towers.',
    coverImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1600&q=80',
    price: 10000,
    currency: 'usd',
    isPublished: true,
    placeCount: 95,
    pageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    slug: 'bali',
    title: 'Bali',
    subtitle: 'Island Guide',
    tagline: 'ᬩᬮᬶ',
    description: 'Beyond the tourist trail. The Bali that locals love — rice terraces at dawn, secret waterfalls, and the finest wellness retreats in Asia.',
    coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80',
    price: 10000,
    currency: 'usd',
    isPublished: true,
    placeCount: 85,
    pageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
