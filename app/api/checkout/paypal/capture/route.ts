import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, getPayPalCapturePurchaseDetails } from '@/lib/paypal'
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
  const details = getPayPalCapturePurchaseDetails(capture)
  if (!details) return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })

  if (details.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to this user' }, { status: 403 })
  }

  const guide = await findGuideByIdOrSlug({ guideId: details.guideId, publishedOnly: true })
  if (!guide) return NextResponse.json({ error: 'Guide not found' }, { status: 404 })

  if (guide.price !== details.amount || guide.currency.toLowerCase() !== details.currency.toLowerCase()) {
    return NextResponse.json({ error: 'PayPal capture amount mismatch' }, { status: 400 })
  }

  const purchase = await recordCompletedPurchase({
    userId: session.user.id,
    guideId: guide.id,
    amount: details.amount,
    currency: details.currency,
    provider: 'paypal',
    externalId: details.externalId,
  })

  return NextResponse.json({ purchase })
}
