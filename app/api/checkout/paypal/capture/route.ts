import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalCapture } from '@/lib/paypal'
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
  const completedCapture = getCompletedPayPalCapture(capture)
  if (completedCapture === null) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  if (completedCapture.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to this user' }, { status: 403 })
  }

  try {
    const purchase = await recordCompletedPurchase({
      ...completedCapture,
      provider: 'paypal',
    })

    return NextResponse.json({ purchase })
  } catch (error) {
    if (error instanceof PurchaseValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    throw error
  }
}
