import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { headers } from 'next/headers'
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
        const { userId, guideId, guideSlug } = session.metadata!

        // TODO: Save purchase to DB
        // await prisma.purchase.create({
        //   data: {
        //     userId,
        //     guideId,
        //     stripePaymentId: session.payment_intent as string,
        //     amount: session.amount_total!,
        //     currency: session.currency!,
        //   },
        // })

        // TODO: Send confirmation email via Resend
        // await sendPurchaseConfirmationEmail({
        //   to: session.customer_email!,
        //   guideTitle: ...,
        //   guideUrl: `https://yourdomain.com/guides/${guideSlug}`,
        // })

        console.log(`Purchase confirmed: user=${userId} guide=${guideId}`)
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
