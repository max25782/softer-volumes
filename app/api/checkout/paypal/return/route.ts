import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppBaseUrl } from '@/lib/app-url'
import { capturePayPalOrder, getCompletedPayPalCapture } from '@/lib/paypal'
import { recordValidatedCompletedPurchase } from '@/lib/purchases'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const encodedGuideSlug = encodeURIComponent(guideSlug)
  const origin = getAppBaseUrl()

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${origin}/guide/${encodedGuideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const completedCapture = getCompletedPayPalCapture(capture)
    if (completedCapture === null || completedCapture.customId.userId !== session.user.id) {
      return NextResponse.redirect(`${origin}/guide/${encodedGuideSlug}?paypal=failed`)
    }

    const { guide } = await recordValidatedCompletedPurchase({
      userId: completedCapture.customId.userId,
      guideId: completedCapture.customId.guideId,
      amount: completedCapture.amount,
      currency: completedCapture.currency,
      provider: 'paypal',
      externalId: completedCapture.externalId,
    })

    return NextResponse.redirect(`${origin}/guides/${guide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${encodedGuideSlug}?paypal=failed`)
  }
}
