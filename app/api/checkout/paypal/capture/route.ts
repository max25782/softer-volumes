import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalPurchase } from '@/lib/paypal'
import { PurchaseValidationError, recordCompletedPurchase } from '@/lib/purchases'

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
  const completedPurchase = getCompletedPayPalPurchase(capture)

  if (!completedPurchase) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (completedPurchase.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to user' }, { status: 403 })
  }

  let purchase
  try {
    purchase = await recordCompletedPurchase({
      userId: completedPurchase.userId,
      guideId: completedPurchase.guideId,
      amount: completedPurchase.amount,
      currency: completedPurchase.currency,
      provider: 'paypal',
      externalId: completedPurchase.externalId,
    })
  } catch (error) {
    if (!(error instanceof PurchaseValidationError)) throw error
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ purchase })
}
