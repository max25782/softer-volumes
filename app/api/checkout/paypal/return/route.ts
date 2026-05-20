import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'
import { capturePayPalOrder, getCompletedPayPalCaptureDetails } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const origin = url.origin

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const details = getCompletedPayPalCaptureDetails(capture)

    if (details === null || details.userId !== session.user.id) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    const dbGuide = await findGuideByIdOrSlug({ guideId: details.guideId, publishedOnly: true })
    const guide = dbGuide !== null ? toGuide(dbGuide) : null

    if (
      guide === null ||
      details.amount !== guide.price ||
      details.currency.toLowerCase() !== guide.currency.toLowerCase()
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
  } catch (err) {
    console.error('PayPal return capture failed:', err)
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
