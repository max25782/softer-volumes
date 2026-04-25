import { prisma } from '@/lib/prisma'
import type { Guide, GuideCategory, GuideCity, Place } from '@/lib/types'

interface DbGuide {
  id: string
  slug: string
  title: string
  subtitle: string
  tagline: string
  description: string
  coverImage: string
  heroImage: string
  price: number
  currency: string
  isPublished: boolean
  mapStyleUrl: string | null
  createdAt: Date
  updatedAt: Date
  _count?: { places: number }
}

interface DbPlace {
  id: string
  guideId: string
  name: string
  description: string
  personalNote: string | null
  category: string
  district: string
  address: string
  lat: number
  lng: number
  priceRange: number | null
  instagramUrl: string | null
  websiteUrl: string | null
  googleMapsUrl: string | null
  isFeatured: boolean
  isPublished: boolean
  photos: Array<{
    id: string
    url: string
    blurhash: string | null
    alt: string
    width: number
    height: number
  }>
}

function isGuideCity(value: string): value is GuideCity {
  return ['seoul', 'tokyo', 'bangkok', 'bali', 'singapore'].includes(value)
}

function isGuideCategory(value: string): value is GuideCategory {
  return ['cafe', 'restaurant', 'bar', 'hotel', 'shop', 'culture', 'wellness'].includes(value)
}

function priceRange(value: number | null): 1 | 2 | 3 | 4 | undefined {
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : undefined
}

export function toGuide(guide: DbGuide): Guide {
  return {
    id: guide.id,
    slug: isGuideCity(guide.slug) ? guide.slug : 'seoul',
    title: guide.title,
    subtitle: guide.subtitle,
    description: guide.description,
    tagline: guide.tagline,
    coverImage: guide.coverImage,
    heroImage: guide.heroImage,
    price: guide.price,
    currency: guide.currency,
    isPublished: guide.isPublished,
    placeCount: guide._count?.places ?? 0,
    pageCount: 0,
    mapStyleUrl: guide.mapStyleUrl ?? undefined,
    createdAt: guide.createdAt.toISOString(),
    updatedAt: guide.updatedAt.toISOString(),
  }
}

export function toPlace(place: DbPlace): Place {
  return {
    id: place.id,
    guideId: place.guideId,
    name: place.name,
    description: place.description,
    personalNote: place.personalNote ?? undefined,
    category: isGuideCategory(place.category) ? place.category : 'culture',
    district: place.district,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    photos: place.photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      blurhash: photo.blurhash ?? undefined,
      alt: photo.alt,
      width: photo.width,
      height: photo.height,
    })),
    instagramUrl: place.instagramUrl ?? undefined,
    websiteUrl: place.websiteUrl ?? undefined,
    googleMapsUrl: place.googleMapsUrl ?? undefined,
    priceRange: priceRange(place.priceRange),
    isFeatured: place.isFeatured,
    isPublished: place.isPublished,
  }
}

export async function findGuideByIdOrSlug(input: {
  guideId?: string
  guideSlug?: string
  publishedOnly?: boolean
}) {
  const where =
    input.guideId !== undefined
      ? { id: input.guideId }
      : input.guideSlug !== undefined
        ? { slug: input.guideSlug }
        : undefined

  if (!where) return null

  return prisma.guide.findFirst({
    where: {
      ...where,
      ...(input.publishedOnly === true ? { isPublished: true } : {}),
    },
    include: { _count: { select: { places: true } } },
  })
}

export async function getPublishedPlacesForGuide(guideId: string): Promise<Place[]> {
  const places = await prisma.place.findMany({
    where: { guideId, isPublished: true },
    include: { photos: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
  })

  return places.map(toPlace)
}
