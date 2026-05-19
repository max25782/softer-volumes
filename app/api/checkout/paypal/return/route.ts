import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppUrl } from '@/lib/app-url'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, parseCompletedPayPalCapture } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const appUrl = getAppUrl()

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${appUrl}/guide/${guideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const completedCapture = parseCompletedPayPalCapture(capture)

    if (completedCapture === null || completedCapture.userId !== session.user.id) {
      return NextResponse.redirect(`${appUrl}/guide/${guideSlug}?paypal=failed`)
    }

    const guide = await findGuideByIdOrSlug({
      guideId: completedCapture.guideId,
      publishedOnly: true,
    })
    if (guide === null) return NextResponse.redirect(`${appUrl}/guide/${guideSlug}?paypal=failed`)

    await recordCompletedPurchase({
      userId: completedCapture.userId,
      guideId: completedCapture.guideId,
      amount: completedCapture.amount,
      currency: completedCapture.currency,
      provider: 'paypal',
      externalId: completedCapture.externalId,
    })

    return NextResponse.redirect(`${appUrl}/guides/${guide.slug}?paypal=success`)
  } catch (error) {
    console.error('PayPal return fulfillment failed:', error)
    return NextResponse.redirect(`${appUrl}/guide/${guideSlug}?paypal=failed`)
  }
}
