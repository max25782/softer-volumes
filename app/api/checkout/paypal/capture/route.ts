import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, parsePayPalAmount, parsePayPalCustomId } from '@/lib/paypal'
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
  const externalId = paymentCapture?.id ?? capture.id
  const amount = parsePayPalAmount(paymentCapture?.amount?.value)
  const currency = paymentCapture?.amount?.currency_code ?? 'USD'
  const customId = parsePayPalCustomId(purchaseUnit?.custom_id)

  if (!paymentCapture?.id || amount === null || customId === null) {
    return NextResponse.json({ error: 'PayPal capture missing purchase details' }, { status: 400 })
  }

  if (customId.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to user' }, { status: 403 })
  }

  const purchase = await recordCompletedPurchase({
    userId: session.user.id,
    guideId: customId.guideId,
    amount,
    currency,
    provider: 'paypal',
    externalId,
  })

  return NextResponse.json({ purchase })
}
