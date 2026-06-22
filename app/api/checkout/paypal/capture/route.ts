import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, parsePayPalCustomId } from '@/lib/paypal'
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
  const metadata = parsePayPalCustomId(purchaseUnit?.custom_id)
  if (metadata === null || metadata.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order metadata mismatch' }, { status: 400 })
  }

  const paymentCapture = capture.purchase_units?.[0]?.payments?.captures?.[0]
  const externalId = paymentCapture?.id ?? capture.id
  const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
  const currency = paymentCapture?.amount?.currency_code ?? 'USD'

  if (amount <= 0) {
    return NextResponse.json({ error: 'PayPal capture missing amount' }, { status: 400 })
  }

  try {
    const purchase = await recordCompletedPurchase({
      userId: session.user.id,
      guideId: metadata.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId,
    })
    return NextResponse.json({ purchase })
  } catch {
    return NextResponse.json({ error: 'PayPal payment does not match this guide' }, { status: 400 })
  }
}
