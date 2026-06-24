import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppBaseUrl } from '@/lib/app-url'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, parsePurchaseMetadata } from '@/lib/paypal'
import { isPurchaseValidationError, recordCompletedPurchase } from '@/lib/purchases'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const appBaseUrl = getAppBaseUrl()

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${appBaseUrl}/guide/${guideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const metadata = parsePurchaseMetadata(capture.purchase_units?.[0]?.custom_id)
    const paymentCapture = capture.purchase_units?.[0]?.payments?.captures?.[0]
    const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'

    if (
      capture.status !== 'COMPLETED' ||
      !paymentCapture?.id ||
      amount <= 0 ||
      metadata === null ||
      metadata.userId !== session.user.id
    ) {
      return NextResponse.redirect(`${appBaseUrl}/guide/${guideSlug}?paypal=failed`)
    }

    const guide = await findGuideByIdOrSlug({
      guideId: metadata.guideId,
      publishedOnly: true,
    })
    if (guide === null) {
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

    return NextResponse.redirect(`${appBaseUrl}/guides/${guide.slug}?paypal=success`)
  } catch (error) {
    if (!isPurchaseValidationError(error)) console.error('PayPal return failed:', error)
    return NextResponse.redirect(`${appBaseUrl}/guide/${guideSlug}?paypal=failed`)
  }
}
