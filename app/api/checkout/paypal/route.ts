import { NextResponse } from 'next/server'
import { getAppBaseUrl } from '@/lib/app-url'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { guideSlug } = (await req.json()) as {
    guideSlug?: string
  }

  if (!guideSlug) {
    return NextResponse.json({ error: 'guideSlug is required' }, { status: 400 })
  }

  const dbGuide = await findGuideByIdOrSlug({ guideSlug, publishedOnly: true })
  if (dbGuide === null) return NextResponse.json({ error: 'Guide not found' }, { status: 404 })

  const guide = toGuide(dbGuide)
  const origin = getAppBaseUrl()
  const order = await createPayPalOrder({
    userId: session.user.id,
    guideId: guide.id,
    guideSlug: guide.slug,
    title: guide.title,
    amount: guide.price,
    currency: guide.currency,
    origin,
  })

  const approvalUrl = order.links?.find((link) => link.rel === 'approve')?.href ?? null
  return NextResponse.json({ id: order.id, approvalUrl })
}
