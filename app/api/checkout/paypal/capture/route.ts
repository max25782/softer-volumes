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

  if (completedCapture === null || completedCapture.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  const { purchase } = await recordValidatedCompletedPurchase({
    userId: session.user.id,
    guideId: completedCapture.guideId,
    amount: completedCapture.amount,
    currency: completedCapture.currency,
    provider: 'paypal',
    externalId: completedCapture.externalId,
  })

  return NextResponse.json({ purchase })
}
