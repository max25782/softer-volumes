'use client'

import Image from 'next/image'
import { useState } from 'react'
import { CategoryBadge, PriceRange } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Place } from '@/lib/types'

interface PlaceCardProps {
  place: Place
  onSelect?: (place: Place) => void
  isSelected?: boolean
  view?: 'grid' | 'list'
}

export function PlaceCard({
  place,
  onSelect,
  isSelected = false,
  view = 'grid',
}: PlaceCardProps) {
  const [imgError, setImgError] = useState(false)
  const firstPhoto = place.photos[0]

  if (view === 'list') {
    return (
      <article
        onClick={() => onSelect?.(place)}
        className={cn(
          'flex gap-4 p-4 border-b border-gold/10',
          'cursor-pointer transition-colors duration-200',
          'hover:bg-gold/[0.03]',
          isSelected && 'bg-gold/[0.06] border-l-2 border-l-gold',
        )}
      >
        {/* Thumbnail */}
        <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden">
          {firstPhoto && !imgError ? (
            <div className="absolute inset-0">
              <Image
                src={firstPhoto.url}
                alt={place.name}
                fill
                className="object-cover img-sepia"
                sizes="80px"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gold/10 flex items-center justify-center">
              <span className="text-2xl">
                {place.category === 'cafe' ? '☕' :
                 place.category === 'restaurant' ? '🍽' :
                 place.category === 'bar' ? '🍸' :
                 place.category === 'hotel' ? '🏯' : '✦'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-display text-lg font-normal text-ink truncate">
              {place.name}
            </h3>
            <PriceRange range={place.priceRange} />
          </div>
          <p className="text-[9px] tracking-[0.2em] uppercase text-mist mb-2">
            {place.district}
          </p>
          {place.personalNote && (
            <p className="text-[10px] leading-relaxed text-mist/80 italic line-clamp-2">
              "{place.personalNote}"
            </p>
          )}
        </div>
      </article>
    )
  }

  // Grid view
  return (
    <article
      onClick={() => onSelect?.(place)}
      className={cn(
        'group relative overflow-hidden cursor-pointer',
        'border border-gold/10',
        'transition-all duration-400',
        'hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/8',
        isSelected && 'ring-1 ring-gold',
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {firstPhoto && !imgError ? (
          <div className="absolute inset-0">
            <Image
              src={firstPhoto.url}
              alt={place.name}
              fill
              className="object-cover img-sepia transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gold/10 flex items-center justify-center">
            <span className="text-5xl opacity-30">
              {place.category === 'cafe' ? '☕' :
               place.category === 'restaurant' ? '🍽' :
               place.category === 'bar' ? '🍸' : '✦'}
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3">
          <CategoryBadge category={place.category} />
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-xl font-normal text-ink">
            {place.name}
          </h3>
          <PriceRange range={place.priceRange} />
        </div>

        <p className="text-[9px] tracking-[0.25em] uppercase text-mist mb-3">
          {place.district}
        </p>

        {place.personalNote && (
          <p className="text-[10px] leading-relaxed italic text-mist/80 mb-3 line-clamp-2 border-l-2 border-gold/30 pl-3">
            "{place.personalNote}"
          </p>
        )}

        {/* Links */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gold/10">
          {place.instagramUrl && (
            <a
              href={place.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[8px] tracking-[0.2em] uppercase text-mist hover:text-gold transition-colors"
            >
              Instagram ↗
            </a>
          )}
          {place.websiteUrl && (
            <a
              href={place.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[8px] tracking-[0.2em] uppercase text-mist hover:text-gold transition-colors"
            >
              Website ↗
            </a>
          )}
          {place.googleMapsUrl && (
            <a
              href={place.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[8px] tracking-[0.2em] uppercase text-mist hover:text-gold transition-colors ml-auto"
            >
              Maps ↗
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
