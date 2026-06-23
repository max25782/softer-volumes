import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder } from '@/lib/paypal'
import {
  parseMajorAmountToCents,
  parsePurchaseMetadata,
  PurchaseValidationError,
  recordCompletedPurchase,
} from '@/lib/purchases'

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
  const metadata = parsePurchaseMetadata(capture.purchase_units?.[0]?.custom_id)
  const externalId = paymentCapture?.id ?? capture.id
  const amount = parseMajorAmountToCents(paymentCapture?.amount?.value)
  const currency = paymentCapture?.amount?.currency_code ?? 'USD'

  if (!paymentCapture?.id || amount === null || metadata === null) {
    return NextResponse.json({ error: 'PayPal capture missing purchase details' }, { status: 400 })
  }

  if (metadata.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal capture belongs to another user' }, { status: 403 })
  }

  let purchase
  try {
    purchase = await recordCompletedPurchase({
      userId: metadata.userId,
      guideId: metadata.guideId,
      amount,
      currency,
      provider: 'paypal',
      externalId,
    })
  } catch (error) {
    if (!(error instanceof PurchaseValidationError)) throw error
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ purchase })
}
