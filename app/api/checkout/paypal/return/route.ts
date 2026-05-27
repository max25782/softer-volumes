import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, getCompletedPayPalPurchase } from '@/lib/paypal'
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
    const completedPurchase = getCompletedPayPalPurchase(capture)

    if (
      capture.status !== 'COMPLETED' ||
      completedPurchase === null ||
      completedPurchase.userId !== session.user.id
    ) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    const guide = await findGuideByIdOrSlug({
      guideId: completedPurchase.guideId,
      publishedOnly: true,
    })

    if (guide === null) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: completedPurchase.userId,
      guideId: completedPurchase.guideId,
      amount: completedPurchase.amount,
      currency: completedPurchase.currency,
      provider: 'paypal',
      externalId: completedPurchase.externalId,
    })

    return NextResponse.redirect(`${origin}/guides/${guide.slug}?paypal=success`)
  } catch (error) {
    console.error('PayPal return fulfillment failed:', error)
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
