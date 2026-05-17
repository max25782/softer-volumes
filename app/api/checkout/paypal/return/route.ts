import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, parsePayPalPurchaseBinding } from '@/lib/paypal'
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
    const purchaseUnit = capture.purchase_units?.[0]
    const paymentCapture = purchaseUnit?.payments?.captures?.[0]
    const purchaseBinding = parsePayPalPurchaseBinding(purchaseUnit?.custom_id)
    const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'

    if (
      capture.status !== 'COMPLETED' ||
      paymentCapture?.status !== 'COMPLETED' ||
      !paymentCapture?.id ||
      !purchaseBinding ||
      purchaseBinding.userId !== session.user.id ||
      amount <= 0
    ) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    const purchase = await recordCompletedPurchase({
      userId: purchaseBinding.userId,
      guideId: purchaseBinding.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId: paymentCapture.id,
    })

    return NextResponse.redirect(`${origin}/guides/${purchase.guide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
