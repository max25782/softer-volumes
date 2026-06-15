import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayPalAccessToken, parsePayPalCustomId } from '@/lib/paypal'
import { recordValidatedCompletedPurchase } from '@/lib/purchases'

interface PayPalWebhookBody {
  event_type?: string
  resource?: {
    id?: string
    status?: string
    custom_id?: string
    amount?: { value?: string; currency_code?: string }
  }
}

async function verifyWebhook(body: PayPalWebhookBody, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return false

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
        webhook_event: JSON.parse(rawBody) as PayPalWebhookBody,
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
    return NextResponse.json({ error: 'Invalid PayPal webhook payload' }, { status: 400 })
  }

  const verified = await verifyWebhook(body, rawBody)

  if (!verified) {
    return NextResponse.json({ error: 'Invalid PayPal webhook signature' }, { status: 400 })
  }

  if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED' && body.resource?.status === 'COMPLETED') {
    const customId = parsePayPalCustomId(body.resource.custom_id)
    const parsedAmount = Number(body.resource.amount?.value)
    const amount = Math.round(parsedAmount * 100)
    const currency = body.resource.amount?.currency_code ?? 'USD'

    if (
      customId !== null &&
      body.resource.id !== undefined &&
      Number.isFinite(parsedAmount) &&
      amount > 0
    ) {
      try {
        await recordValidatedCompletedPurchase({
          userId: customId.userId,
          guideId: customId.guideId,
          amount,
          currency,
          provider: 'paypal',
          externalId: body.resource.id,
        })
      } catch (error) {
        console.error('PayPal webhook failed purchase validation', body.resource.id, error)
        return NextResponse.json({ error: 'Invalid purchase metadata' }, { status: 400 })
      }
    } else {
      console.error('PayPal capture webhook missing required purchase metadata', body.resource?.id)
      return NextResponse.json({ error: 'Invalid purchase metadata' }, { status: 400 })
    }
  }

  return NextResponse.json({ received: true })
}
