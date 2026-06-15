import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalCapture } from '@/lib/paypal'
import { recordValidatedCompletedPurchase } from '@/lib/purchases'

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
  const completedCapture = getCompletedPayPalCapture(capture)
  if (completedCapture === null) {
    return NextResponse.json({ error: 'PayPal capture is missing verified purchase data' }, { status: 400 })
  }

  if (completedCapture.customId.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to this user' }, { status: 403 })
  }

  const { purchase } = await recordValidatedCompletedPurchase({
    userId: completedCapture.customId.userId,
    guideId: completedCapture.customId.guideId,
    amount: completedCapture.amount,
    currency: completedCapture.currency,
    provider: 'paypal',
    externalId: completedCapture.externalId,
  })

  return NextResponse.json({ purchase })
}
