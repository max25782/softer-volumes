// ── Guide types ──────────────────────────────────────────

export type GuideCategory =
  | 'cafe'
  | 'restaurant'
  | 'bar'
  | 'hotel'
  | 'shop'
  | 'culture'
  | 'wellness'

export type GuideCity =
  | 'seoul'
  | 'tokyo'
  | 'bangkok'
  | 'bali'
  | 'singapore'

export interface Guide {
  id: string
  slug: GuideCity
  title: string
  subtitle: string
  description: string
  tagline: string          // e.g. "서울" (native script)
  coverImage: string
  heroImage: string
  price: number            // in USD cents e.g. 10000 = $100
  currency: string         // 'usd'
  isPublished: boolean
  placeCount: number
  pageCount: number
  mapStyleUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Place {
  id: string
  guideId: string
  name: string
  description: string
  personalNote?: string    // Her personal note — the soul of the product
  category: GuideCategory
  district: string
  address: string
  lat: number
  lng: number
  photos: PlacePhoto[]
  instagramUrl?: string
  websiteUrl?: string
  googleMapsUrl?: string
  priceRange?: 1 | 2 | 3 | 4  // $ $$ $$$ $$$$
  isFeatured: boolean
  isPublished: boolean
}

export interface PlacePhoto {
  id: string
  url: string
  blurhash?: string
  alt: string
  width: number
  height: number
}

// ── User / Auth types ─────────────────────────────────────

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  instagramHandle?: string
  createdAt: string
}

export interface Purchase {
  id: string
  userId: string
  guideId: string
  guide?: Guide
  amount: number
  currency: string
  stripePaymentId?: string
  paypalOrderId?: string
  createdAt: string
}

// ── Filter types ──────────────────────────────────────────

export interface GuideFilters {
  category: GuideCategory | 'all'
  district: string | 'all'
  priceRange: number | 'all'
  search: string
}

// ── API response types ────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
