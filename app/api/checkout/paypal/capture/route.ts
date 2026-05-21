import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalPurchaseDetails } from '@/lib/paypal'
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
  const purchaseDetails = getCompletedPayPalPurchaseDetails(capture)
  if (!purchaseDetails) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (purchaseDetails.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to this user' }, { status: 403 })
  }

  const purchase = await recordCompletedPurchase({
    userId: session.user.id,
    guideId: purchaseDetails.guideId,
    amount: purchaseDetails.amount,
    currency: purchaseDetails.currency,
    provider: 'paypal',
    externalId: purchaseDetails.externalId,
  })

  return NextResponse.json({ purchase })
}
