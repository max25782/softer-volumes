import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalCaptureDetails } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

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
    const completedCapture = getCompletedPayPalCaptureDetails(capture, {
      userId: session.user.id,
      guideId,
    })
    if (!completedCapture) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: completedCapture.userId,
      guideId: completedCapture.guideId,
      amount: completedCapture.amount,
      currency: completedCapture.currency,
      provider: 'paypal',
      externalId: completedCapture.externalId,
    })

    return NextResponse.redirect(`${origin}/guides/${guideSlug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
