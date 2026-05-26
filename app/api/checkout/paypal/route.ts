import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'
import { createPayPalOrder } from '@/lib/paypal'
import { getAppBaseUrl } from '@/lib/url'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { guideId, guideSlug } = (await req.json()) as {
    guideId?: string
    guideSlug?: string
  }

  const dbGuide = await findGuideByIdOrSlug({
    guideId: guideSlug === undefined ? guideId : undefined,
    guideSlug,
    publishedOnly: true,
  })

  if (!dbGuide) return NextResponse.json({ error: 'Guide not found' }, { status: 404 })

  const guide = toGuide(dbGuide)
  const appBaseUrl = getAppBaseUrl(req)
  const order = await createPayPalOrder({
    userId: session.user.id,
    guideId: guide.id,
    guideSlug: guide.slug,
    title: guide.title,
    amount: guide.price,
    currency: guide.currency,
    origin: appBaseUrl,
  })

  const approvalUrl = order.links?.find((link) => link.rel === 'approve')?.href ?? null
  return NextResponse.json({ id: order.id, approvalUrl })
}
