import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, parsePayPalPurchaseBinding } from '@/lib/paypal'
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
  if (capture.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  const purchaseUnit = capture.purchase_units?.[0]
  const paymentCapture = purchaseUnit?.payments?.captures?.[0]
  const purchaseBinding = parsePayPalPurchaseBinding(purchaseUnit?.custom_id)
  const externalId = paymentCapture?.id ?? capture.id
  const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
  const currency = paymentCapture?.amount?.currency_code ?? 'USD'

  if (
    paymentCapture?.status !== 'COMPLETED' ||
    !purchaseBinding ||
    purchaseBinding.userId !== session.user.id ||
    amount <= 0
  ) {
    return NextResponse.json({ error: 'PayPal capture metadata mismatch' }, { status: 400 })
  }

  try {
    const purchase = await recordCompletedPurchase({
      userId: purchaseBinding.userId,
      guideId: purchaseBinding.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId,
    })
    return NextResponse.json({ purchase })
  } catch (error) {
    console.error('PayPal purchase validation failed:', externalId, error)
    return NextResponse.json({ error: 'PayPal capture validation failed' }, { status: 400 })
  }
}
