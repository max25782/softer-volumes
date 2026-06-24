import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayPalAccessToken, parsePurchaseMetadata } from '@/lib/paypal'
import { isPurchaseValidationError, recordCompletedPurchase } from '@/lib/purchases'

interface PayPalWebhookBody {
  event_type?: string
  resource?: {
    id?: string
    status?: string
    custom_id?: string
    amount?: { value?: string; currency_code?: string }
  }
}

async function verifyWebhook(body: PayPalWebhookBody): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) {
    console.error('PAYPAL_WEBHOOK_ID is not configured')
    return false
  }

  const headersList = await headers()
  const token = await getPayPalAccessToken()
  const response = await fetch(
    `${process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: headersList.get('paypal-auth-algo'),
        cert_url: headersList.get('paypal-cert-url'),
        transmission_id: headersList.get('paypal-transmission-id'),
        transmission_sig: headersList.get('paypal-transmission-sig'),
        transmission_time: headersList.get('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: body,
      }),
    },
  )

  if (!response.ok) return false
  const json = (await response.json()) as { verification_status?: string }
  return json.verification_status === 'SUCCESS' && body.event_type !== undefined
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  let body: PayPalWebhookBody

  try {
    body = JSON.parse(rawBody) as PayPalWebhookBody
  } catch {
    return NextResponse.json({ error: 'Invalid PayPal webhook body' }, { status: 400 })
  }

  const verified = await verifyWebhook(body)

  if (!verified) {
    return NextResponse.json({ error: 'Invalid PayPal webhook signature' }, { status: 400 })
  }

  if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED' && body.resource?.status === 'COMPLETED') {
    const metadata = parsePurchaseMetadata(body.resource.custom_id)
    const amount = Math.round(Number(body.resource.amount?.value ?? 0) * 100)
    const currency = body.resource.amount?.currency_code ?? 'USD'

    if (metadata !== null && body.resource.id && amount > 0) {
      try {
        await recordCompletedPurchase({
          userId: metadata.userId,
          guideId: metadata.guideId,
          amount,
          currency,
          provider: 'paypal',
          externalId: body.resource.id,
        })
      } catch (error) {
        if (!isPurchaseValidationError(error)) throw error
        console.error('PayPal purchase validation failed:', error.message)
      }
    }
  }

  return NextResponse.json({ received: true })
}
