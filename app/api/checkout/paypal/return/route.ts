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
  const failureSlug = encodeURIComponent(guideSlug !== '' ? guideSlug : 'seoul')

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${origin}/guide/${failureSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const completedPurchase = getCompletedPayPalPurchase(capture)

    if (completedPurchase === null || completedPurchase.userId !== session.user.id) {
      return NextResponse.redirect(`${origin}/guide/${failureSlug}?paypal=failed`)
    }

    const guide = await findGuideByIdOrSlug({
      guideId: completedPurchase.guideId,
      publishedOnly: true,
    })
    if (guide === null) {
      return NextResponse.redirect(`${origin}/guide/${failureSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: completedPurchase.userId,
      guideId: completedPurchase.guideId,
      amount: completedPurchase.amount,
      currency: completedPurchase.currency,
      provider: 'paypal',
      externalId: completedPurchase.externalId,
    })

    return NextResponse.redirect(`${origin}/guides/${guide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${failureSlug}?paypal=failed`)
  }
}
