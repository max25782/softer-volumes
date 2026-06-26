import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, parseCompletedPayPalCapture } from '@/lib/paypal'
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
    const completedPurchase = parseCompletedPayPalCapture(capture)

    if (!completedPurchase || completedPurchase.userId !== session.user.id) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: session.user.id,
      guideId: completedPurchase.guideId,
      amount: completedPurchase.amount,
      currency: completedPurchase.currency,
      provider: 'paypal',
      externalId: completedPurchase.externalId,
    })

    const guide = await findGuideByIdOrSlug({
      guideId: completedPurchase.guideId,
      publishedOnly: true,
    })
    const redirectSlug = guide?.slug ?? guideSlug

    return NextResponse.redirect(`${origin}/guides/${redirectSlug}?paypal=success`)
  } catch (error) {
    console.error('PayPal return failed:', error)
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
