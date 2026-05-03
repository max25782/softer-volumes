import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalCaptureDetails } from '@/lib/paypal'
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
  const completedCapture = getCompletedPayPalCaptureDetails(capture, {
    userId: session.user.id,
    guideId,
  })
  if (!completedCapture) {
    return NextResponse.json({ error: 'PayPal order was not completed for this guide' }, { status: 400 })
  }

  const purchase = await recordCompletedPurchase({
    userId: completedCapture.userId,
    guideId: completedCapture.guideId,
    amount: completedCapture.amount,
    currency: completedCapture.currency,
    provider: 'paypal',
    externalId: completedCapture.externalId,
  })

  return NextResponse.json({ purchase })
}
