import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder } from '@/lib/paypal'
import {
  parseMajorAmountToCents,
  parsePurchaseMetadata,
  recordCompletedPurchase,
} from '@/lib/purchases'
import { getAppBaseUrl } from '@/lib/app-url'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const appBaseUrl = getAppBaseUrl(req)

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${appBaseUrl}/guide/${guideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const paymentCapture = capture.purchase_units?.[0]?.payments?.captures?.[0]
    const metadata = parsePurchaseMetadata(capture.purchase_units?.[0]?.custom_id)
    const amount = parseMajorAmountToCents(paymentCapture?.amount?.value)
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'

    if (capture.status !== 'COMPLETED' || !paymentCapture?.id || amount === null || metadata === null) {
      return NextResponse.redirect(`${appBaseUrl}/guide/${guideSlug}?paypal=failed`)
    }

    if (metadata.userId !== session.user.id) {
      return NextResponse.redirect(`${appBaseUrl}/guide/${guideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: metadata.userId,
      guideId: metadata.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId: paymentCapture.id,
    })

    return NextResponse.redirect(`${appBaseUrl}/guides/${guideSlug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${appBaseUrl}/guide/${guideSlug}?paypal=failed`)
  }
}
