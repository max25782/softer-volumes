import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getPayPalCapturePurchase } from '@/lib/paypal'
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
  if (capture.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  const { externalId, amount, currency, metadata } = getPayPalCapturePurchase(capture)

  if (metadata === null || metadata.userId !== session.user.id || amount <= 0) {
    return NextResponse.json({ error: 'PayPal capture metadata mismatch' }, { status: 400 })
  }

  const purchase = await recordCompletedPurchase({
    userId: session.user.id,
    guideId: metadata.guideId,
    amount,
    currency,
    provider: 'paypal',
    externalId,
  })

  return NextResponse.json({ purchase })
}
