import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'
import { capturePayPalOrder, getCompletedPayPalCaptureDetails } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId } = (await req.json()) as {
    orderId?: string
  }

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  const capture = await capturePayPalOrder(orderId)
  const details = getCompletedPayPalCaptureDetails(capture)

  if (details === null) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (details.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to this user' }, { status: 403 })
  }

  const dbGuide = await findGuideByIdOrSlug({ guideId: details.guideId, publishedOnly: true })
  const guide = dbGuide !== null ? toGuide(dbGuide) : null

  if (guide === null) {
    return NextResponse.json({ error: 'PayPal order guide is not available' }, { status: 400 })
  }

  if (
    details.amount !== guide.price ||
    details.currency.toLowerCase() !== guide.currency.toLowerCase()
  ) {
    return NextResponse.json({ error: 'PayPal order amount does not match guide price' }, { status: 400 })
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
