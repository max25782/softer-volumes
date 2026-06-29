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
  const encodedGuideSlug = encodeURIComponent(guideSlug)
  const origin = getAppBaseUrl()

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${origin}/guide/${encodedGuideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const paymentCapture = capture.purchase_units?.[0]?.payments?.captures?.[0]
    const metadata = parsePayPalCustomId(capture.purchase_units?.[0]?.custom_id)
    const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'

    if (
      capture.status !== 'COMPLETED' ||
      !paymentCapture ||
      paymentCapture.status !== 'COMPLETED' ||
      !metadata ||
      metadata.userId !== session.user.id ||
      amount <= 0
    ) {
      return NextResponse.redirect(`${origin}/guide/${encodedGuideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: session.user.id,
      guideId: metadata.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId: paymentCapture.id,
    })

    return NextResponse.redirect(`${origin}/guides/${encodedGuideSlug}?paypal=success`)
  } catch (error) {
    console.error('PayPal return fulfillment failed:', error)
    return NextResponse.redirect(`${origin}/guide/${encodedGuideSlug}?paypal=failed`)
  }
}
