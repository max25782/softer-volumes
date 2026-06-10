import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppBaseUrl } from '@/lib/app-url'
import { capturePayPalOrder, parseCompletedPayPalPurchase } from '@/lib/paypal'
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
    const completedPurchase = parseCompletedPayPalPurchase(capture)

    if (completedPurchase === null || completedPurchase.userId !== session.user.id) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    const purchase = await recordCompletedPurchase({
      userId: completedPurchase.userId,
      guideId: completedPurchase.guideId,
      amount: completedPurchase.amount,
      currency: completedPurchase.currency,
      provider: 'paypal',
      externalId: completedPurchase.externalId,
    })

    return NextResponse.redirect(`${origin}/guides/${purchase.guide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
