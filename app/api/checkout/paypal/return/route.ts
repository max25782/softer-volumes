import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'
import { capturePayPalOrder, parsePayPalPurchaseBinding } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideId = url.searchParams.get('guideId')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const origin = url.origin

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const paymentCapture = capture.purchase_units?.[0]?.payments?.captures?.[0]
    const purchaseBinding = parsePayPalPurchaseBinding(capture.purchase_units?.[0]?.custom_id)
    const paymentCaptureId = paymentCapture?.id
    const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
    const currency = paymentCapture?.amount?.currency_code ?? 'USD'

    if (
      capture.status !== 'COMPLETED' ||
      paymentCapture?.status !== 'COMPLETED' ||
      !paymentCaptureId ||
      !purchaseBinding ||
      purchaseBinding.userId !== session.user.id ||
      (guideId !== null && purchaseBinding.guideId !== guideId) ||
      amount <= 0
    ) {
      return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
    }

    await recordCompletedPurchase({
      userId: session.user.id,
      guideId: purchaseBinding.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId: paymentCaptureId,
    })

    const dbGuide = await findGuideByIdOrSlug({
      guideId: purchaseBinding.guideId,
      publishedOnly: true,
    })
    if (!dbGuide) return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)

    const guide = toGuide(dbGuide)
    return NextResponse.redirect(`${origin}/guides/${guide.slug}?paypal=success`)
  } catch {
    return NextResponse.redirect(`${origin}/guide/${guideSlug}?paypal=failed`)
  }
}
