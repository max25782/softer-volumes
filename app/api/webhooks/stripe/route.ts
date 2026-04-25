import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { headers } from 'next/headers'
import { recordCompletedPurchase } from '@/lib/purchases'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const stripe = getStripe()
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === 'paid') {
        const userId = session.metadata?.userId
        const guideId = session.metadata?.guideId
        const paymentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : session.id

        if (!userId || !guideId || session.amount_total === null || !session.currency) {
          console.error('Stripe session missing required purchase metadata', session.id)
          break
        }

        await recordCompletedPurchase({
          userId,
          guideId,
          amount: session.amount_total,
          currency: session.currency,
          provider: 'stripe',
          externalId: paymentId,
        })
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      console.error(`Payment failed: ${intent.id}`)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
