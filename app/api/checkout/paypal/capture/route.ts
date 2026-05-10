import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'
import {
  capturePayPalOrder,
  getCompletedPayPalCaptureDetails,
  isExpectedPayPalCapture,
} from '@/lib/paypal'
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

  if (guideId !== details.guideId) {
    return NextResponse.json({ error: 'PayPal order guide mismatch' }, { status: 400 })
  }

  const dbGuide = await findGuideByIdOrSlug({ guideId: details.guideId, publishedOnly: true })
  const guide =
    dbGuide !== null ? toGuide(dbGuide) : MOCK_GUIDES.find((item) => item.id === details.guideId)

  if (!guide) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
  }

  if (
    !isExpectedPayPalCapture(details, {
      userId: session.user.id,
      guideId: guide.id,
      amount: guide.price,
      currency: guide.currency,
    })
  ) {
    return NextResponse.json({ error: 'PayPal order details mismatch' }, { status: 400 })
  }

  const purchase = await recordCompletedPurchase({
    userId: details.userId,
    guideId: details.guideId,
    amount: details.amount,
    currency: details.currency,
    provider: 'paypal',
    externalId: details.externalId,
  })

  return NextResponse.json({ purchase })
}
