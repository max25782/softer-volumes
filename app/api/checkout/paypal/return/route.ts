import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, parsePayPalPurchaseMetadata } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'
import { getAppBaseUrl } from '@/lib/url'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const appBaseUrl = getAppBaseUrl(req)
  const failedRedirect = `${appBaseUrl}/guide/${encodeURIComponent(guideSlug)}?paypal=failed`

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(failedRedirect)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const purchaseUnit = capture.purchase_units?.[0]
    const purchaseMetadata = parsePayPalPurchaseMetadata(purchaseUnit?.custom_id)
    const paymentCapture = purchaseUnit?.payments?.captures?.[0]
    const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'

    if (
      capture.status !== 'COMPLETED' ||
      !paymentCapture?.id ||
      purchaseMetadata?.userId !== session.user.id ||
      amount <= 0
    ) {
      return NextResponse.redirect(failedRedirect)
    }

    const purchase = await recordCompletedPurchase({
      userId: session.user.id,
      guideId: purchaseMetadata.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId: paymentCapture.id,
    })

    if (purchase === null) return NextResponse.redirect(failedRedirect)

    return NextResponse.redirect(`${appBaseUrl}/guides/${purchase.guide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(failedRedirect)
  }
}
