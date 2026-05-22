import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppOrigin } from '@/lib/app-url'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, getCompletedPayPalCaptureDetails } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const appOrigin = getAppOrigin()

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${appOrigin}/guide/${guideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const details = getCompletedPayPalCaptureDetails(capture)

    if (!details || details.userId !== session.user.id) {
      return NextResponse.redirect(`${appOrigin}/guide/${guideSlug}?paypal=failed`)
    }

    const guide = await findGuideByIdOrSlug({ guideId: details.guideId, publishedOnly: true })
    if (!guide) {
      return NextResponse.redirect(`${appOrigin}/guide/${guideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: details.userId,
      guideId: details.guideId,
      amount: details.amount,
      currency: details.currency,
      provider: 'paypal',
      externalId: details.externalId,
    })

    return NextResponse.redirect(`${appOrigin}/guides/${guide.slug}?paypal=success`)
  } catch (error) {
    console.error('PayPal return capture failed:', error)
    return NextResponse.redirect(`${appOrigin}/guide/${guideSlug}?paypal=failed`)
  }
}
