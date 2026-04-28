import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCapturedPayPalPurchase } from '@/lib/paypal'
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
    const purchase = getCapturedPayPalPurchase(capture)

    if (
      capture.status !== 'COMPLETED' ||
      !purchase ||
      purchase.metadata.userId !== session.user.id ||
      purchase.metadata.guideId !== guideId
    ) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: session.user.id,
      guideId: purchase.metadata.guideId,
      amount: purchase.amount,
      currency: purchase.currency,
      provider: 'paypal',
      externalId: purchase.externalId,
    })

    return NextResponse.redirect(`${origin}/guides/${guideSlug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
