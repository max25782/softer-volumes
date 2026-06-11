import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { capturePayPalOrder, getCompletedPayPalCaptureDetails } from '@/lib/paypal'
import {
  parsePurchaseBinding,
  PurchaseValidationError,
  recordCompletedPurchaseForPublishedGuide,
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
  const details = getCompletedPayPalCaptureDetails(capture)
  if (details === null) {
    return NextResponse.json({ error: 'PayPal order was not completed' }, { status: 400 })
  }

  const binding = parsePurchaseBinding(details.customId)
  if (binding === null) {
    return NextResponse.json({ error: 'PayPal order missing purchase binding' }, { status: 400 })
  }

  if (binding.userId !== session.user.id) {
    return NextResponse.json({ error: 'PayPal order belongs to a different user' }, { status: 403 })
  }

  try {
    const { purchase } = await recordCompletedPurchaseForPublishedGuide({
      userId: binding.userId,
      guideId: binding.guideId,
      amount: details.amount,
      currency: details.currency,
      provider: 'paypal',
      externalId: details.externalId,
    })

    return NextResponse.json({ purchase })
  } catch (error) {
    if (error instanceof PurchaseValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
}
