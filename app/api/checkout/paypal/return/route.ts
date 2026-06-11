import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAppOrigin } from '@/lib/app-url'
import { capturePayPalOrder, getCompletedPayPalCaptureDetails } from '@/lib/paypal'
import {
  parsePurchaseBinding,
  PurchaseValidationError,
  recordCompletedPurchaseForPublishedGuide,
} from '@/lib/purchases'

function failureUrl(origin: string, guideSlug: string): string {
  return guideSlug ? `${origin}/guide/${guideSlug}?paypal=failed` : `${origin}/?paypal=failed`
}

export async function GET(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const orderId = url.searchParams.get('token')
  const guideSlug = url.searchParams.get('guideSlug') ?? ''
  const origin = getAppOrigin()

  if (!session?.user?.id || !orderId) {
    return NextResponse.redirect(failureUrl(origin, guideSlug))
  }

  try {
    const capture = await capturePayPalOrder(orderId)
    const details = getCompletedPayPalCaptureDetails(capture)
    if (details === null) {
      return NextResponse.redirect(failureUrl(origin, guideSlug))
    }

    const binding = parsePurchaseBinding(details.customId)
    if (binding === null || binding.userId !== session.user.id) {
      return NextResponse.redirect(failureUrl(origin, guideSlug))
    }

    const { guide } = await recordCompletedPurchaseForPublishedGuide({
      userId: binding.userId,
      guideId: binding.guideId,
      amount: details.amount,
      currency: details.currency,
      provider: 'paypal',
      externalId: details.externalId,
    })

    return NextResponse.redirect(`${origin}/guides/${guide.slug}?paypal=success`)
  } catch (error) {
    if (!(error instanceof PurchaseValidationError)) {
      console.error('PayPal return fulfillment failed:', error)
    }
    return NextResponse.redirect(failureUrl(origin, guideSlug))
  }
}
