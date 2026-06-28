import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppBaseUrl } from '@/lib/app-url'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, parsePayPalCustomId } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

function getFailureUrl(appBaseUrl: string, guideSlug: string): string {
  if (guideSlug) return `${appBaseUrl}/guide/${guideSlug}?paypal=failed`
  return `${appBaseUrl}/dashboard?paypal=failed`
}

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const appBaseUrl = getAppBaseUrl()
  const failureUrl = getFailureUrl(appBaseUrl, guideSlug)

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(failureUrl)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const paymentCapture = capture.purchase_units?.[0]?.payments?.captures?.[0]
    const customId = parsePayPalCustomId(capture.purchase_units?.[0]?.custom_id)
    const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'

    if (
      capture.status !== 'COMPLETED' ||
      !paymentCapture?.id ||
      customId === null ||
      customId.userId !== session.user.id ||
      amount <= 0
    ) {
      return NextResponse.redirect(failureUrl)
    }

    const guide = await findGuideByIdOrSlug({ guideId: customId.guideId, publishedOnly: true })
    if (guide === null) return NextResponse.redirect(failureUrl)

    await recordCompletedPurchase({
      userId: session.user.id,
      guideId: customId.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId: paymentCapture.id,
    })

    return NextResponse.redirect(`${appBaseUrl}/guides/${guide.slug}?paypal=success`)
  } catch (error) {
    console.error('PayPal return capture failed:', error)
    return NextResponse.redirect(failureUrl)
  }
}
