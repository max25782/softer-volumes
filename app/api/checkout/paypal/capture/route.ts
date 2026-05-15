import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { capturePayPalOrder, parseCompletedPayPalPurchase } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId, guideId } = (await req.json()) as {
    orderId?: string
    guideId?: string
  }

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  const capture = await capturePayPalOrder(orderId)
  const completedPurchase = parseCompletedPayPalPurchase(capture)

  if (completedPurchase === null) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (
    completedPurchase.userId !== session.user.id ||
    (guideId !== undefined && guideId !== completedPurchase.guideId)
  ) {
    return NextResponse.json({ error: 'PayPal order metadata mismatch' }, { status: 400 })
  }

  const guide = await findGuideByIdOrSlug({
    guideId: completedPurchase.guideId,
    publishedOnly: true,
  })

  if (
    guide === null ||
    completedPurchase.amount !== guide.price ||
    completedPurchase.currency.toLowerCase() !== guide.currency.toLowerCase()
  ) {
    return NextResponse.json({ error: 'PayPal order amount mismatch' }, { status: 400 })
  }

  const purchase = await recordCompletedPurchase({
    userId: completedPurchase.userId,
    guideId: completedPurchase.guideId,
    amount: completedPurchase.amount,
    currency: completedPurchase.currency,
    provider: 'paypal',
    externalId: completedPurchase.captureId,
  })

  return NextResponse.json({ purchase })
}
