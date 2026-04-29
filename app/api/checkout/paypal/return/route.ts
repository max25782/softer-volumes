import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, getPayPalCaptureDetails } from '@/lib/paypal'
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
    const details = getPayPalCaptureDetails(capture)

    if (capture.status !== 'COMPLETED' || details === null || details.userId !== session.user.id) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    const guide = await findGuideByIdOrSlug({ guideId: details.guideId, publishedOnly: true })
    if (guide === null) return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)

    await recordCompletedPurchase({
      userId: session.user.id,
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
