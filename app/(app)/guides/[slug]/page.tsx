import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { MOCK_GUIDES } from '@/lib/utils'
import { GuideExperience } from '@/components/guide/GuideExperience'
import type { Guide } from '@/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = MOCK_GUIDES.find((g) => g.slug === slug)
  if (!guide) return {}
  return { title: `${guide.title} — Your Guide` }
}

// In production: check purchase in DB
async function checkAccess(userId: string, guideId: string): Promise<boolean> {
  // const purchase = await prisma.purchase.findFirst({
  //   where: { userId, guideId },
  // })
  // return !!purchase

  return true // mock — always allow in dev
}

// In production: fetch places from DB
async function getPlaces(guideId: string) {
  // return await prisma.place.findMany({
  //   where: { guideId, isPublished: true },
  //   include: { photos: true },
  //   orderBy: { isFeatured: 'desc' },
  // })

  // Mock places for development
  return [
    {
      id: '1', guideId, name: 'Café Onion Anguk', isFeatured: true, isPublished: true,
      description: 'Inside a renovated Korean hanok. Three floors of impeccably styled spaces.',
      personalNote: 'I come here every Sunday morning. Order the croissant. Arrive before 10am.',
      category: 'cafe' as const, district: 'Bukchon', address: '10 Bukchon-ro, Jongno-gu',
      lat: 37.5816, lng: 126.9856, priceRange: 2 as const,
      photos: [{ id: 'ph1', url: 'https://images.unsplash.com/photo-1586079425904-4cb1e0f07ff1?w=600&q=80', alt: 'Café Onion', width: 600, height: 400 }],
      instagramUrl: 'https://instagram.com', websiteUrl: 'https://example.com', googleMapsUrl: 'https://maps.google.com',
    },
    {
      id: '2', guideId, name: 'Mingles', isFeatured: true, isPublished: true,
      description: 'Modern Korean fine dining by Chef Mingoo Kang. One Michelin star.',
      personalNote: 'Book 3 weeks in advance. The omakase menu changes seasonally. Worth every penny.',
      category: 'restaurant' as const, district: 'Gangnam', address: 'Dosan-daero, Gangnam-gu',
      lat: 37.5235, lng: 127.0401, priceRange: 4 as const,
      photos: [{ id: 'ph2', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', alt: 'Mingles', width: 600, height: 400 }],
      instagramUrl: 'https://instagram.com', websiteUrl: 'https://example.com', googleMapsUrl: 'https://maps.google.com',
    },
    {
      id: '3', guideId, name: 'Charles H.', isFeatured: false, isPublished: true,
      description: 'Hidden speakeasy in the basement of Four Seasons Seoul.',
      personalNote: 'Dark, quiet, exceptional cocktails. My favourite bar in the city.',
      category: 'bar' as const, district: 'Gwanghwamun', address: '97 Saemunan-ro, Jongno-gu',
      lat: 37.5706, lng: 126.9767, priceRange: 4 as const,
      photos: [{ id: 'ph3', url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&q=80', alt: 'Charles H.', width: 600, height: 400 }],
      instagramUrl: 'https://instagram.com', websiteUrl: 'https://example.com', googleMapsUrl: 'https://maps.google.com',
    },
    {
      id: '4', guideId, name: 'Aank House', isFeatured: false, isPublished: true,
      description: 'Boutique hanok hotel in Bukchon. Six rooms, each a design object.',
      personalNote: 'The most beautiful place to sleep in Seoul. Book the courtyard room.',
      category: 'hotel' as const, district: 'Bukchon', address: 'Bukchon-ro, Jongno-gu',
      lat: 37.5830, lng: 126.9841, priceRange: 3 as const,
      photos: [{ id: 'ph4', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80', alt: 'Aank House', width: 600, height: 400 }],
      instagramUrl: 'https://instagram.com', websiteUrl: 'https://example.com', googleMapsUrl: 'https://maps.google.com',
    },
    {
      id: '5', guideId, name: 'Gentle Monster', isFeatured: false, isPublished: true,
      description: 'More art installation than eyewear store. Flagship in Sinsa.',
      personalNote: 'Even if you don\'t buy anything — walk through. The installations change every season.',
      category: 'shop' as const, district: 'Sinsa', address: 'Apgujeong-ro, Gangnam-gu',
      lat: 37.5269, lng: 127.0283, priceRange: 3 as const,
      photos: [{ id: 'ph5', url: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80', alt: 'Gentle Monster', width: 600, height: 400 }],
      instagramUrl: 'https://instagram.com', websiteUrl: 'https://example.com', googleMapsUrl: 'https://maps.google.com',
    },
    {
      id: '6', guideId, name: 'Leeum Museum', isFeatured: false, isPublished: true,
      description: 'Samsung\'s private art museum. Korean antiquities beside contemporary art.',
      personalNote: 'Go on a weekday morning. The permanent collection alone takes 2 hours.',
      category: 'culture' as const, district: 'Itaewon', address: '60-16 Itaewon-ro 55ga-gil',
      lat: 37.5385, lng: 126.9989, priceRange: 1 as const,
      photos: [{ id: 'ph6', url: 'https://images.unsplash.com/photo-1605429523419-d828acb941d9?w=600&q=80', alt: 'Leeum', width: 600, height: 400 }],
      instagramUrl: 'https://instagram.com', websiteUrl: 'https://example.com', googleMapsUrl: 'https://maps.google.com',
    },
  ]
}

export default async function GuideInteriorPage({ params }: Props) {
  const { slug } = await params
  const guide = MOCK_GUIDES.find((g) => g.slug === slug) as Guide | undefined
  if (!guide) notFound()

  const session = await auth()
  const hasAccess = await checkAccess(session!.user!.id as string, guide.id)

  if (!hasAccess) {
    redirect(`/guide/${slug}?upgrade=true`)
  }

  const places = await getPlaces(guide.id)

  return <GuideExperience guide={guide} places={places as any} />
}
