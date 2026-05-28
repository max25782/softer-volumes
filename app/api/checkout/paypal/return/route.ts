import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppBaseUrl } from '@/lib/app-url'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, getCompletedPayPalPurchase } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const origin = getAppBaseUrl(req)

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${origin}/guide/${encodeURIComponent(guideSlug)}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const completedPurchase = getCompletedPayPalPurchase(capture)

    if (!completedPurchase || completedPurchase.userId !== session.user.id) {
      return NextResponse.redirect(`${origin}/guide/${encodeURIComponent(guideSlug)}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: completedPurchase.userId,
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
    const purchasedGuideSlug = guide?.slug ?? guideSlug

    return NextResponse.redirect(
      `${origin}/guides/${encodeURIComponent(purchasedGuideSlug)}?paypal=success`
    )
  } catch {
    return NextResponse.redirect(`${origin}/guide/${encodeURIComponent(guideSlug)}?paypal=failed`)
  }
}
