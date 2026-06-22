import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, parsePayPalCustomId } from '@/lib/paypal'
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
    const paymentCapture = capture.purchase_units?.[0]?.payments?.captures?.[0]
    const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'
    const metadata = parsePayPalCustomId(capture.purchase_units?.[0]?.custom_id)

    if (
      capture.status !== 'COMPLETED' ||
      !paymentCapture?.id ||
      amount <= 0 ||
      metadata === null ||
      metadata.userId !== session.user.id
    ) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    const guide = await findGuideByIdOrSlug({
      guideId: metadata.guideId,
      guideSlug,
      publishedOnly: true,
    })
    if (guide === null) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: session.user.id,
      guideId: guide.id,
      amount,
      currency,
      provider: 'paypal',
      externalId: paymentCapture.id,
    })

    return NextResponse.redirect(`${origin}/guides/${guide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
