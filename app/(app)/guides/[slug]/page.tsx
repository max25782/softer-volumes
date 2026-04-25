import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug, getPublishedPlacesForGuide, toGuide } from '@/lib/guides'
import { hasCompletedPurchase } from '@/lib/purchases'
import { GuideExperience } from '@/components/guide/GuideExperience'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = await findGuideByIdOrSlug({ guideSlug: slug, publishedOnly: true })
  if (!guide) return {}
  return { title: `${guide.title} — Your Guide` }
}

async function checkAccess(userId: string, guideId: string): Promise<boolean> {
  return hasCompletedPurchase(userId, guideId)
}

export default async function GuideInteriorPage({ params }: Props) {
  const { slug } = await params
  const dbGuide = await findGuideByIdOrSlug({ guideSlug: slug, publishedOnly: true })
  if (!dbGuide) notFound()

  const session = await auth()
  const hasAccess = await checkAccess(session!.user!.id, dbGuide.id)

  if (!hasAccess) {
    redirect(`/guide/${slug}?upgrade=true`)
  }

  const guide = toGuide(dbGuide)
  const places = await getPublishedPlacesForGuide(dbGuide.id)

  return <GuideExperience guide={guide} places={places} />
}
