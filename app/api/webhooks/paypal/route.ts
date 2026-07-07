import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayPalAccessToken } from '@/lib/paypal'
import { markProviderPurchaseStatus, recordCompletedPurchase } from '@/lib/purchases'

interface PayPalWebhookBody {
  event_type?: string
  resource?: {
    id?: string
    status?: string
    custom_id?: string
    amount?: { value?: string; currency_code?: string }
    supplementary_data?: {
      related_ids?: {
        capture_id?: string
      }
    }
    links?: Array<{
      href?: string
      rel?: string
    }>
  }
}

function parseAmount(value: string | undefined): number {
  return Math.round(Number(value ?? 0) * 100)
}

function getCaptureIdFromPayPalHref(href: string | undefined): string | null {
  const match = href?.match(/\/v2\/payments\/captures\/([^/?#]+)/)
  return match?.[1] ?? null
}

function getRefundedCaptureId(resource: PayPalWebhookBody['resource']): string | null {
  const relatedCaptureId = resource?.supplementary_data?.related_ids?.capture_id
  if (relatedCaptureId) return relatedCaptureId

  const captureLink = resource?.links?.find(
    (link) => link.rel === 'up' && link.href?.includes('/v2/payments/captures/') === true,
  )

  return getCaptureIdFromPayPalHref(captureLink?.href)
}

async function verifyWebhook(body: PayPalWebhookBody, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return process.env.NODE_ENV !== 'production'

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
  const body = JSON.parse(rawBody) as PayPalWebhookBody
  const verified = await verifyWebhook(body, rawBody)

  if (!verified) {
    return NextResponse.json({ error: 'Invalid PayPal webhook signature' }, { status: 400 })
  }

  if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED' && body.resource?.status === 'COMPLETED') {
    const [userId, guideId] = (body.resource.custom_id ?? '').split(':')
    const amount = parseAmount(body.resource.amount?.value)
    const currency = body.resource.amount?.currency_code ?? 'USD'

    if (userId && guideId && body.resource.id && amount > 0) {
      await recordCompletedPurchase({
        userId,
        guideId,
        amount,
        currency,
        provider: 'paypal',
        externalId: body.resource.id,
      })
    }
  } else if (
    body.event_type === 'PAYMENT.CAPTURE.REFUNDED' &&
    body.resource?.status === 'COMPLETED'
  ) {
    const captureId = getRefundedCaptureId(body.resource)
    const amount = parseAmount(body.resource.amount?.value)
    const currency = body.resource.amount?.currency_code

    if (captureId && amount > 0 && currency) {
      await markProviderPurchaseStatus({
        provider: 'paypal',
        externalId: captureId,
        status: 'refunded',
        amount,
        currency,
      })
    } else {
      console.error('PayPal refund webhook missing original capture details', body.resource?.id)
    }
  }

  return NextResponse.json({ received: true })
}
