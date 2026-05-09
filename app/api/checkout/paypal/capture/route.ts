import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  capturePayPalOrder,
  getCompletedPayPalCaptureDetails,
  isPayPalCaptureForGuide,
} from '@/lib/paypal'
import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'
import { recordCompletedPurchase } from '@/lib/purchases'
import { MOCK_GUIDES } from '@/lib/utils'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId, guideId } = (await req.json()) as {
    orderId?: string
    guideId?: string
  }

  if (!orderId || !guideId) {
    return NextResponse.json({ error: 'orderId and guideId are required' }, { status: 400 })
  }

  const capture = await capturePayPalOrder(orderId)
  const details = getCompletedPayPalCaptureDetails(capture)

  if (!details) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (details.userId !== session.user.id || details.guideId !== guideId) {
    return NextResponse.json({ error: 'PayPal order metadata mismatch' }, { status: 400 })
  }

  const dbGuide = await findGuideByIdOrSlug({ guideId: details.guideId, publishedOnly: true })
  const guide =
    dbGuide !== null
      ? toGuide(dbGuide)
      : MOCK_GUIDES.find((item) => item.id === details.guideId)

  if (!guide || !isPayPalCaptureForGuide(details, guide)) {
    return NextResponse.json({ error: 'PayPal capture does not match guide price' }, { status: 400 })
  }

  const purchase = await recordCompletedPurchase({
    userId: session.user.id,
    guideId: details.guideId,
    amount: details.amount,
    currency: details.currency,
    provider: 'paypal',
    externalId: details.externalId,
  })

  return NextResponse.json({ purchase })
}
