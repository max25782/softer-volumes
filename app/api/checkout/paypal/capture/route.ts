import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, parsePayPalPurchaseMetadata } from '@/lib/paypal'
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
  const purchaseMetadata = parsePayPalPurchaseMetadata(purchaseUnit?.custom_id)
  const paymentCapture = purchaseUnit?.payments?.captures?.[0]
  const externalId = paymentCapture?.id ?? capture.id
  const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
  const currency = paymentCapture?.amount?.currency_code ?? 'USD'

  if (purchaseMetadata?.userId !== session.user.id || amount <= 0) {
    return NextResponse.json({ error: 'PayPal capture metadata is invalid' }, { status: 400 })
  }

  const purchase = await recordCompletedPurchase({
    userId: session.user.id,
    guideId: purchaseMetadata.guideId,
    amount,
    currency,
    provider: 'paypal',
    externalId,
  })

  if (purchase === null) {
    return NextResponse.json({ error: 'PayPal capture did not match guide pricing' }, { status: 400 })
  }

  return NextResponse.json({ purchase })
}
