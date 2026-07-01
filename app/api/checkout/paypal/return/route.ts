import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalCaptureDetails } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'
import { getAppBaseUrl } from '@/lib/urls'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const origin = getAppBaseUrl()

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const details = getCompletedPayPalCaptureDetails(capture)

    if (details === null || details.userId !== session.user.id) {
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

    return NextResponse.redirect(`${origin}/guides/${guideSlug}?paypal=success`)
  } catch (error) {
    console.error('PayPal return validation failed:', error)
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
