import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, getCompletedPayPalPurchase } from '@/lib/paypal'
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
  const completedPurchase = getCompletedPayPalPurchase(capture)
  if (!completedPurchase) {
    return NextResponse.json({ error: 'PayPal capture missing purchase metadata' }, { status: 400 })
  }

  if (completedPurchase.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not match this checkout' }, { status: 400 })
  }

  const guide = await findGuideByIdOrSlug({ guideId: completedPurchase.guideId, publishedOnly: true })
  if (!guide) return NextResponse.json({ error: 'Guide not found' }, { status: 404 })

  if (
    completedPurchase.amount !== guide.price ||
    completedPurchase.currency.toLowerCase() !== guide.currency.toLowerCase()
  ) {
    return NextResponse.json({ error: 'PayPal capture amount does not match guide price' }, { status: 400 })
  }

  const purchase = await recordCompletedPurchase({
    userId: session.user.id,
    guideId: completedPurchase.guideId,
    amount: completedPurchase.amount,
    currency: completedPurchase.currency,
    provider: 'paypal',
    externalId: completedPurchase.externalId,
  })

  return NextResponse.json({ purchase })
}
