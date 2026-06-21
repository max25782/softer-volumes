import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppBaseUrl } from '@/lib/app-url'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, getPayPalCapturePurchase } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

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
    const { externalId, amount, currency, metadata } = getPayPalCapturePurchase(capture)

    if (capture.status !== 'COMPLETED' || metadata === null || metadata.userId !== session.user.id || amount <= 0) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: session.user.id,
      guideId: metadata.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId,
    })

    const guide = await findGuideByIdOrSlug({ guideId: metadata.guideId, publishedOnly: true })
    return NextResponse.redirect(`${origin}/guides/${guide?.slug ?? guideSlug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
