import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppUrlForPath } from '@/lib/app-url'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, getCompletedPayPalCapture } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(getAppUrlForPath('/?paypal=failed'))
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const completedCapture = getCompletedPayPalCapture(capture)

    if (completedCapture === null || completedCapture.userId !== session.user.id) {
      return NextResponse.redirect(getAppUrlForPath('/?paypal=failed'))
    }

    const guide = await findGuideByIdOrSlug({
      guideId: completedCapture.guideId,
      publishedOnly: true,
    })

    if (guide === null) {
      return NextResponse.redirect(getAppUrlForPath('/?paypal=failed'))
    }

    await recordCompletedPurchase({
      userId: completedCapture.userId,
      guideId: completedCapture.guideId,
      amount: completedCapture.amount,
      currency: completedCapture.currency,
      provider: 'paypal',
      externalId: completedCapture.externalId,
    })

    return NextResponse.redirect(getAppUrlForPath(`/guides/${guide.slug}?paypal=success`))
  } catch {
    return NextResponse.redirect(getAppUrlForPath('/?paypal=failed'))
  }
}
