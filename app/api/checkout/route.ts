import { NextResponse } from 'next/server'
import { getAppBaseUrl } from '@/lib/app-url'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { guideSlug } = (await req.json()) as {
    guideSlug?: string
  }

  if (!guideSlug) {
    return NextResponse.json({ error: 'guideSlug is required' }, { status: 400 })
  }

  const dbGuide = await findGuideByIdOrSlug({ guideSlug, publishedOnly: true })
  if (dbGuide === null) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
  }

  const guide = toGuide(dbGuide)
  const origin = getAppBaseUrl()

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_options: {
      card: { request_three_d_secure: 'automatic' },
    },
    // Enable Apple Pay & Google Pay via wallets
    // These are enabled automatically via Stripe Dashboard settings

    customer_email: session.user.email,

    line_items: [
      {
        price_data: {
          currency: guide.currency,
          product_data: {
            name: `${guide.title} City Guide`,
            description: guide.description,
            images: [guide.coverImage],
            metadata: { guideId: guide.id, guideSlug: guide.slug },
          },
          unit_amount: guide.price,
        },
        quantity: 1,
      },
    ],

    // Automatic tax (Stripe Tax) — requires activation in Stripe Dashboard
    automatic_tax: { enabled: true },

    metadata: {
      userId: session.user.id,
      guideId: guide.id,
      guideSlug: guide.slug,
    },

    success_url: `${origin}/guides/${guide.slug}?success=true`,
    cancel_url:  `${origin}/guide/${guide.slug}?cancelled=true`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
