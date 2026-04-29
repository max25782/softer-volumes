import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getPayPalCaptureDetails } from '@/lib/paypal'
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
  const purchase = getPayPalCaptureDetails(capture)

  if (capture.status !== 'COMPLETED' || purchase === null) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (purchase.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to this user' }, { status: 403 })
  }

  const completedPurchase = await recordCompletedPurchase({
    userId: session.user.id,
    guideId: purchase.guideId,
    amount: purchase.amount,
    currency: purchase.currency,
    provider: 'paypal',
    externalId: purchase.externalId,
  })

  return NextResponse.json({ purchase: completedPurchase })
}
