import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppBaseUrl } from '@/lib/app-url'
import { capturePayPalOrder, parsePayPalAmount, parsePayPalCustomId } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const appBaseUrl = getAppBaseUrl()

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${appBaseUrl}/guide/${encodeURIComponent(guideSlug)}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const purchaseUnit = capture.purchase_units?.[0]
    const paymentCapture = purchaseUnit?.payments?.captures?.[0]
    const amount = parsePayPalAmount(paymentCapture?.amount?.value)
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'
    const customId = parsePayPalCustomId(purchaseUnit?.custom_id)

    if (capture.status !== 'COMPLETED' || !paymentCapture?.id || amount === null || customId === null) {
      return NextResponse.redirect(`${appBaseUrl}/guide/${encodeURIComponent(guideSlug)}?paypal=failed`)
    }

    if (customId.userId !== session.user.id) {
      return NextResponse.redirect(`${appBaseUrl}/guide/${encodeURIComponent(guideSlug)}?paypal=failed`)
    }

    const purchase = await recordCompletedPurchase({
      userId: session.user.id,
      guideId: customId.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId: paymentCapture.id,
    })

    return NextResponse.redirect(`${appBaseUrl}/guides/${purchase.guide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${appBaseUrl}/guide/${encodeURIComponent(guideSlug)}?paypal=failed`)
  }
}
