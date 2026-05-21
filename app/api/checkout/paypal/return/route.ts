import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, getCompletedPayPalPurchaseDetails } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

function getAppOrigin(req: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
}

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const origin = getAppOrigin(req)

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const purchaseDetails = getCompletedPayPalPurchaseDetails(capture)

    if (!purchaseDetails || purchaseDetails.userId !== session.user.id) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    const guide = await findGuideByIdOrSlug({
      guideId: purchaseDetails.guideId,
      publishedOnly: true,
    })
    if (!guide) return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)

    await recordCompletedPurchase({
      userId: session.user.id,
      guideId: purchaseDetails.guideId,
      amount: purchaseDetails.amount,
      currency: purchaseDetails.currency,
      provider: 'paypal',
      externalId: purchaseDetails.externalId,
    })

    return NextResponse.redirect(`${origin}/guides/${guide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
