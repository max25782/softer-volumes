import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, getCompletedPayPalCapturePurchase } from '@/lib/paypal'
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
    const capturedPurchase = getCompletedPayPalCapturePurchase(capture)

    if (capturedPurchase === null || capturedPurchase.userId !== session.user.id) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    const dbGuide = await findGuideByIdOrSlug({
      guideId: capturedPurchase.guideId,
      publishedOnly: true,
    })
    if (dbGuide === null) return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)

    await recordCompletedPurchase({
      userId: session.user.id,
      guideId: capturedPurchase.guideId,
      amount: capturedPurchase.amount,
      currency: capturedPurchase.currency,
      provider: 'paypal',
      externalId: capturedPurchase.externalId,
    })

    return NextResponse.redirect(`${origin}/guides/${dbGuide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
