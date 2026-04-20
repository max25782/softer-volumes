'use client'

import { useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { PlaceCard } from './PlaceCard'
import { GuideFiltersBar } from './GuideFilters'
import type { Guide, Place, GuideFilters, GuideCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

// Lazy load map — heavy bundle
const GuideMap = dynamic(() => import('./GuideMap').then((m) => m.GuideMap), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-charcoal/5 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
        <p className="text-eyebrow text-mist">Loading map…</p>
      </div>
    </div>
  ),
})

interface GuideExperienceProps {
  guide: Guide
  places: Place[]
}

const defaultFilters: GuideFilters = {
  category: 'all',
  district: 'all',
  priceRange: 'all',
  search: '',
}

export function GuideExperience({ guide, places }: GuideExperienceProps) {
  const [filters, setFilters] = useState<GuideFilters>(defaultFilters)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [showMap, setShowMap] = useState(true)

  // Get unique districts
  const districts = useMemo(
    () => [...new Set(places.map((p) => p.district))].sort(),
    [places]
  )

  // Filter places
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      if (filters.category !== 'all' && p.category !== filters.category) return false
      if (filters.district !== 'all' && p.district !== filters.district) return false
      if (filters.priceRange !== 'all' && p.priceRange !== filters.priceRange) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [places, filters])

  const handleFilterChange = useCallback((partial: Partial<GuideFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }))
    setSelectedPlace(null)
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── Guide header ── */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-paper border-b border-gold/10 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-korean text-lg text-mist/60">{guide.tagline}</span>
            <span className="text-gold/30">·</span>
            <h1 className="font-display text-2xl font-normal text-ink">{guide.title}</h1>
          </div>
          <p className="text-[9px] tracking-[0.3em] uppercase text-mist mt-0.5">
            City Guide — {places.length} Places
          </p>
        </div>

        {/* Search + map toggle */}
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search places…"
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="hidden md:block text-[10px] tracking-wide bg-warm border border-gold/15 px-4 py-2 w-48 focus:outline-none focus:border-gold text-ink placeholder:text-mist"
          />
          <button
            onClick={() => setShowMap((v) => !v)}
            className={cn(
              'text-[9px] tracking-[0.25em] uppercase px-4 py-2 border transition-colors',
              showMap
                ? 'border-gold text-gold bg-gold/8'
                : 'border-gold/20 text-mist hover:border-gold/40'
            )}
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <GuideFiltersBar
        filters={filters}
        districts={districts}
        onChange={handleFilterChange}
        view={view}
        onViewChange={setView}
        totalCount={places.length}
        filteredCount={filteredPlaces.length}
      />

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Places panel */}
        <div
          className={cn(
            'overflow-y-auto bg-warm',
            showMap
              ? 'w-full md:w-[420px] lg:w-[480px] shrink-0'
              : 'w-full'
          )}
        >
          {filteredPlaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <span className="font-display text-5xl text-gold/20 mb-4">✦</span>
              <p className="font-display text-xl font-light text-ink mb-2">
                No places found
              </p>
              <p className="text-caption text-mist">
                Try adjusting your filters
              </p>
              <button
                onClick={() => setFilters(defaultFilters)}
                className="mt-6 text-[9px] tracking-[0.3em] uppercase text-gold border border-gold/30 px-4 py-2 hover:bg-gold/8 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  view="grid"
                  isSelected={selectedPlace?.id === place.id}
                  onSelect={setSelectedPlace}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  view="list"
                  isSelected={selectedPlace?.id === place.id}
                  onSelect={setSelectedPlace}
                />
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        {showMap && (
          <div className="hidden md:flex flex-1 relative">
            <GuideMap
              places={filteredPlaces}
              selectedPlace={selectedPlace}
              onSelectPlace={setSelectedPlace}
              guide={guide}
            />
          </div>
        )}
      </div>
    </div>
  )
}
