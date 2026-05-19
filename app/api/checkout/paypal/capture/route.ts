import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, parseCompletedPayPalCapture } from '@/lib/paypal'
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
  const completedCapture = parseCompletedPayPalCapture(capture)

  if (completedCapture === null) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (completedCapture.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to this user' }, { status: 403 })
  }

  if (guideId !== undefined && guideId !== completedCapture.guideId) {
    return NextResponse.json({ error: 'PayPal order does not match requested guide' }, { status: 400 })
  }

  try {
    const purchase = await recordCompletedPurchase({
      userId: completedCapture.userId,
      guideId: completedCapture.guideId,
      amount: completedCapture.amount,
      currency: completedCapture.currency,
      provider: 'paypal',
      externalId: completedCapture.externalId,
    })

    return NextResponse.json({ purchase })
  } catch (error) {
    console.error('PayPal capture validation failed:', error)
    return NextResponse.json({ error: 'Invalid PayPal purchase' }, { status: 400 })
  }
}
