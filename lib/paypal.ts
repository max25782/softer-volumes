export interface PayPalOrder {
  id: string
  status: string
  links?: Array<{ href: string; rel: string }>
}

export interface PayPalCapture {
  id: string
  status: string
  purchase_units?: Array<{
    custom_id?: string
    payments?: {
      captures?: Array<{
        id: string
        status: string
        amount?: { value?: string; currency_code?: string }
      }>
    }
  }>
}

export interface CompletedPayPalPurchase {
  userId: string
  guideId: string
  externalId: string
  amount: number
  currency: string
}

export function parsePayPalCustomId(customId?: string): { userId: string; guideId: string } | null {
  if (customId === undefined || customId === '') return null

  const parts = customId.split(':')
  if (parts.length !== 2 || parts[0] === '' || parts[1] === '') return null

  return { userId: parts[0], guideId: parts[1] }
}

export function parseCompletedPayPalPurchase(
  capture: PayPalCapture,
): CompletedPayPalPurchase | null {
  if (capture.status !== 'COMPLETED') return null

  const purchaseUnit = capture.purchase_units?.[0]
  const paymentCapture = purchaseUnit?.payments?.captures?.[0]
  if (paymentCapture?.status !== 'COMPLETED' || paymentCapture.id === '') return null

  const custom = parsePayPalCustomId(purchaseUnit?.custom_id)
  if (custom === null) return null

  const amountValue = Number(paymentCapture.amount?.value)
  const amount = Math.round(amountValue * 100)
  const currency = paymentCapture.amount?.currency_code

  if (!Number.isFinite(amountValue) || amount <= 0 || currency === undefined || currency === '') {
    return null
  }

  return {
    userId: custom.userId,
    guideId: custom.guideId,
    externalId: paymentCapture.id,
    amount,
    currency,
  }
}

function getPayPalBaseUrl(): string {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

function getPayPalCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set')
  }
  return { clientId, clientSecret }
}

export async function getPayPalAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getPayPalCredentials()
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.status}`)
  }

  const json = (await response.json()) as { access_token?: string }
  if (!json.access_token) throw new Error('PayPal auth response missing access token')
  return json.access_token
}

export async function createPayPalOrder(input: {
  userId: string
  guideId: string
  guideSlug: string
  title: string
  amount: number
  currency: string
  origin: string
}): Promise<PayPalOrder> {
  const token = await getPayPalAccessToken()
  const value = (input.amount / 100).toFixed(2)

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: `${input.userId}:${input.guideId}`,
          description: `${input.title} City Guide`,
          amount: {
            currency_code: input.currency.toUpperCase(),
            value,
          },
        },
      ],
      application_context: {
        brand_name: 'Softer Volumes',
        user_action: 'PAY_NOW',
        return_url: `${input.origin}/api/checkout/paypal/return?guideSlug=${input.guideSlug}`,
        cancel_url: `${input.origin}/guide/${input.guideSlug}?paypal=cancelled`,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`PayPal create order failed: ${response.status}`)
  }

  return (await response.json()) as PayPalOrder
}

export async function capturePayPalOrder(orderId: string): Promise<PayPalCapture> {
  const token = await getPayPalAccessToken()
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  })

  if (!response.ok) {
    throw new Error(`PayPal capture failed: ${response.status}`)
  }

  return (await response.json()) as PayPalCapture
}
