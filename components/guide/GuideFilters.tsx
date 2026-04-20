'use client'

import { cn, categoryConfig } from '@/lib/utils'
import type { GuideCategory, GuideFilters } from '@/lib/types'
import { LayoutGrid, List } from 'lucide-react'

interface GuideFiltersBarProps {
  filters: GuideFilters
  districts: string[]
  onChange: (filters: Partial<GuideFilters>) => void
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
  totalCount: number
  filteredCount: number
}

const categories: Array<{ value: GuideCategory | 'all'; label: string; icon: string }> = [
  { value: 'all',        label: 'All',       icon: '✦'  },
  { value: 'cafe',       label: 'Cafés',     icon: '☕'  },
  { value: 'restaurant', label: 'Dining',    icon: '🍽'  },
  { value: 'bar',        label: 'Bars',      icon: '🍸'  },
  { value: 'hotel',      label: 'Hotels',    icon: '🏯'  },
  { value: 'shop',       label: 'Shops',     icon: '🛍'  },
  { value: 'culture',    label: 'Culture',   icon: '🎨'  },
  { value: 'wellness',   label: 'Wellness',  icon: '✿'   },
]

export function GuideFiltersBar({
  filters,
  districts,
  onChange,
  view,
  onViewChange,
  totalCount,
  filteredCount,
}: GuideFiltersBarProps) {
  return (
    <div className="sticky top-[72px] z-40 bg-warm/95 backdrop-blur-sm border-b border-gold/10">

      {/* Category pills — scrollable on mobile */}
      <div className="flex items-center gap-2 px-4 md:px-8 py-3 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onChange({ category: cat.value })}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-4 py-2',
              'text-[9px] tracking-[0.25em] uppercase font-sans font-normal',
              'border transition-all duration-200',
              filters.category === cat.value
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-gold/15 text-mist hover:border-gold/40 hover:text-ink'
            )}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Bottom row — district + count + view toggle */}
      <div className="flex items-center justify-between px-4 md:px-8 py-2 border-t border-gold/8">

        {/* District filter */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] tracking-[0.3em] uppercase text-mist hidden sm:block">
            District
          </span>
          <select
            value={filters.district}
            onChange={(e) => onChange({ district: e.target.value })}
            className="text-[9px] tracking-[0.2em] uppercase bg-transparent border border-gold/15 text-ink px-3 py-1.5 focus:outline-none focus:border-gold"
          >
            <option value="all">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Count + view toggle */}
        <div className="flex items-center gap-4">
          <span className="text-[9px] tracking-[0.25em] uppercase text-mist">
            {filteredCount === totalCount
              ? `${totalCount} places`
              : `${filteredCount} of ${totalCount}`}
          </span>
          <div className="flex items-center border border-gold/15">
            <button
              onClick={() => onViewChange('grid')}
              className={cn(
                'p-2 transition-colors',
                view === 'grid' ? 'text-gold bg-gold/10' : 'text-mist hover:text-ink'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={cn(
                'p-2 transition-colors border-l border-gold/15',
                view === 'list' ? 'text-gold bg-gold/10' : 'text-mist hover:text-ink'
              )}
              aria-label="List view"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
