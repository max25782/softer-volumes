import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, parsePurchaseMetadata } from '@/lib/paypal'
import { isPurchaseValidationError, recordCompletedPurchase } from '@/lib/purchases'

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
  const externalId = paymentCapture?.id ?? capture.id
  const amount = Math.round(Number(paymentCapture?.amount?.value ?? 0) * 100)
  const currency = paymentCapture?.amount?.currency_code ?? 'USD'
  const metadata = parsePurchaseMetadata(capture.purchase_units?.[0]?.custom_id)

  if (amount <= 0 || metadata === null || metadata.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal capture did not match checkout metadata' }, { status: 400 })
  }

  try {
    const purchase = await recordCompletedPurchase({
      userId: metadata.userId,
      guideId: metadata.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId,
    })

    return NextResponse.json({ purchase })
  } catch (error) {
    if (isPurchaseValidationError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
}
