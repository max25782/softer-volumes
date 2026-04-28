import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCapturedPayPalPurchase } from '@/lib/paypal'
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

  if (!orderId || !guideId) {
    return NextResponse.json({ error: 'orderId and guideId are required' }, { status: 400 })
  }

  const capture = await capturePayPalOrder(orderId)
  if (capture.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  const completedPurchase = getCapturedPayPalPurchase(capture)

  if (!completedPurchase) {
    return NextResponse.json({ error: 'PayPal capture missing purchase metadata' }, { status: 400 })
  }

  if (
    completedPurchase.metadata.userId !== session.user.id ||
    completedPurchase.metadata.guideId !== guideId
  ) {
    return NextResponse.json({ error: 'PayPal order does not match requested purchase' }, { status: 400 })
  }

  const purchase = await recordCompletedPurchase({
    userId: session.user.id,
    guideId: completedPurchase.metadata.guideId,
    amount: completedPurchase.amount,
    currency: completedPurchase.currency,
    provider: 'paypal',
    externalId: completedPurchase.externalId,
  })

  return NextResponse.json({ purchase })
}
