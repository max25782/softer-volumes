import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { buildAppUrl } from '@/lib/app-url'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, parsePayPalCustomId } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

function paypalFailureRedirect(guideSlug: string): NextResponse {
  const path =
    guideSlug !== ''
      ? `/guide/${encodeURIComponent(guideSlug)}?paypal=failed`
      : '/?paypal=failed'
  return NextResponse.redirect(buildAppUrl(path))
}

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''

  if (!session?.user?.id || !orderId) {
    return paypalFailureRedirect(guideSlug)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const purchaseUnit = capture.purchase_units?.[0]
    const customId = parsePayPalCustomId(purchaseUnit?.custom_id)
    const paymentCapture = purchaseUnit?.payments?.captures?.[0]
    const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'

    if (
      capture.status !== 'COMPLETED' ||
      customId === null ||
      customId.userId !== session.user.id ||
      !paymentCapture?.id ||
      amount <= 0
    ) {
      return paypalFailureRedirect(guideSlug)
    }

    await recordCompletedPurchase({
      userId: session.user.id,
      guideId: customId.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId: paymentCapture.id,
    })

    const guide = await findGuideByIdOrSlug({
      guideId: customId.guideId,
      publishedOnly: true,
    })

    if (guide === null) return paypalFailureRedirect(guideSlug)

    return NextResponse.redirect(
      buildAppUrl(`/guides/${encodeURIComponent(guide.slug)}?paypal=success`),
    )
  } catch (error) {
    console.error('PayPal return fulfillment failed:', error)
    return paypalFailureRedirect(guideSlug)
  }
}
