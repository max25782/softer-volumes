import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, parseCompletedPayPalPurchase } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

function guideUrl(origin: string, path: 'guide' | 'guides', slug: string, query: string): string {
  return `${origin}/${path}/${encodeURIComponent(slug)}?${query}`
}

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideId = url.searchParams.get('guideId')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const origin = url.origin

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(guideUrl(origin, 'guide', guideSlug, 'paypal=failed'))
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const completedPurchase = parseCompletedPayPalPurchase(capture)

    if (
      completedPurchase === null ||
      completedPurchase.userId !== session.user.id ||
      (guideId !== null && guideId !== completedPurchase.guideId)
    ) {
      return NextResponse.redirect(guideUrl(origin, 'guide', guideSlug, 'paypal=failed'))
    }

    const guide = await findGuideByIdOrSlug({
      guideId: completedPurchase.guideId,
      publishedOnly: true,
    })

    if (
      guide === null ||
      completedPurchase.amount !== guide.price ||
      completedPurchase.currency.toLowerCase() !== guide.currency.toLowerCase()
    ) {
      return NextResponse.redirect(guideUrl(origin, 'guide', guideSlug, 'paypal=failed'))
    }

    await recordCompletedPurchase({
      userId: completedPurchase.userId,
      guideId: completedPurchase.guideId,
      amount: completedPurchase.amount,
      currency: completedPurchase.currency,
      provider: 'paypal',
      externalId: completedPurchase.captureId,
    })

    return NextResponse.redirect(guideUrl(origin, 'guides', guide.slug, 'paypal=success'))
  } catch {
    return NextResponse.redirect(guideUrl(origin, 'guide', guideSlug, 'paypal=failed'))
  }
}
