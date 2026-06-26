import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, parseCompletedPayPalCapture } from '@/lib/paypal'
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
  const completedPurchase = parseCompletedPayPalCapture(capture)

  if (!completedPurchase) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (completedPurchase.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order belongs to a different user' }, { status: 403 })
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
