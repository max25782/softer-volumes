import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalCapturePurchase } from '@/lib/paypal'
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
  const capturedPurchase = getCompletedPayPalCapturePurchase(capture)
  if (capturedPurchase === null) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (capturedPurchase.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to this user' }, { status: 403 })
  }

  try {
    const purchase = await recordCompletedPurchase({
      userId: session.user.id,
      guideId: capturedPurchase.guideId,
      amount: capturedPurchase.amount,
      currency: capturedPurchase.currency,
      provider: 'paypal',
      externalId: capturedPurchase.externalId,
    })

    return NextResponse.json({ purchase })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to record purchase'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
