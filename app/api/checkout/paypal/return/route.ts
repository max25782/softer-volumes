import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'
import {
  capturePayPalOrder,
  getCompletedPayPalCaptureDetails,
  isExpectedPayPalCapture,
} from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'
import { MOCK_GUIDES } from '@/lib/utils'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideId = url.searchParams.get('guideId')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const origin = url.origin

  if (!session?.user?.id || !orderId || !guideId) {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const details = getCompletedPayPalCaptureDetails(capture)
    if (!details || details.guideId !== guideId) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    const dbGuide = await findGuideByIdOrSlug({ guideId: details.guideId, publishedOnly: true })
    const guide =
      dbGuide !== null ? toGuide(dbGuide) : MOCK_GUIDES.find((item) => item.id === details.guideId)

    if (
      !guide ||
      !isExpectedPayPalCapture(details, {
        userId: session.user.id,
        guideId: guide.id,
        amount: guide.price,
        currency: guide.currency,
      })
    ) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: details.userId,
      guideId: details.guideId,
      amount: details.amount,
      currency: details.currency,
      provider: 'paypal',
      externalId: details.externalId,
    })

    return NextResponse.redirect(`${origin}/guides/${guide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
