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

  const paymentCapture = capture.purchase_units?.[0]?.payments?.captures?.[0]
  const purchaseBinding = parsePayPalCustomId(capture.purchase_units?.[0]?.custom_id)
  const externalId = paymentCapture?.id ?? capture.id
  const amountValue = Number(paymentCapture?.amount?.value ?? 0)
  const amount = Number.isFinite(amountValue) ? Math.round(amountValue * 100) : 0
  const currency = paymentCapture?.amount?.currency_code ?? 'USD'

  if (!paymentCapture?.id || paymentCapture.status !== 'COMPLETED' || amount <= 0) {
    return NextResponse.json({ error: 'PayPal capture missing completed payment' }, { status: 400 })
  }

  if (purchaseBinding === null) {
    return NextResponse.json({ error: 'PayPal capture missing purchase metadata' }, { status: 400 })
  }

  if (purchaseBinding.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order does not belong to this user' }, { status: 403 })
  }

  const purchase = await recordCompletedPurchase({
    userId: purchaseBinding.userId,
    guideId: purchaseBinding.guideId,
    amount,
    currency,
    provider: 'paypal',
    externalId,
  })

  return NextResponse.json({ purchase })
}
