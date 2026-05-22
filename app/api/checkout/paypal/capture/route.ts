import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalCaptureDetails } from '@/lib/paypal'
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
  const details = getCompletedPayPalCaptureDetails(capture)
  if (!details) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (details.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to this user' }, { status: 403 })
  }

  let purchase
  try {
    purchase = await recordCompletedPurchase({
      userId: details.userId,
      guideId: details.guideId,
      amount: details.amount,
      currency: details.currency,
      provider: 'paypal',
      externalId: details.externalId,
    })
  } catch (error) {
    console.error('PayPal purchase validation failed:', error)
    return NextResponse.json({ error: 'PayPal purchase validation failed' }, { status: 422 })
  }

  return NextResponse.json({ purchase })
}
