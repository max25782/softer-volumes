import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppBaseUrl } from '@/lib/app-url'
import { capturePayPalOrder, parsePayPalCustomId } from '@/lib/paypal'
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
    const paymentCapture = capture.purchase_units?.[0]?.payments?.captures?.[0]
    const purchaseBinding = parsePayPalCustomId(capture.purchase_units?.[0]?.custom_id)
    const amountValue = Number(paymentCapture?.amount?.value ?? 0)
    const amount = Number.isFinite(amountValue) ? Math.round(amountValue * 100) : 0
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'

    if (
      capture.status !== 'COMPLETED' ||
      !paymentCapture?.id ||
      paymentCapture.status !== 'COMPLETED' ||
      amount <= 0 ||
      purchaseBinding === null ||
      purchaseBinding.userId !== session.user.id
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
  } catch (error) {
    console.error('PayPal return capture failed', error)
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
