import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { guideId, guideSlug } = (await req.json()) as {
    guideId?: string
    guideSlug?: string
  }

  const dbGuide = await findGuideByIdOrSlug({ guideId, guideSlug, publishedOnly: true })
  if (!dbGuide) {
    return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get('origin') ?? 'http://localhost:3000'

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
          currency: dbGuide.currency,
          product_data: {
            name: `${dbGuide.title} City Guide`,
            description: dbGuide.description,
            images: [dbGuide.coverImage],
            metadata: { guideId: dbGuide.id, guideSlug: dbGuide.slug },
          },
          unit_amount: dbGuide.price,
        },
        quantity: 1,
      },
    ],

    // Automatic tax (Stripe Tax) — requires activation in Stripe Dashboard
    automatic_tax: { enabled: true },

    metadata: {
      userId: session.user.id,
      guideId: dbGuide.id,
      guideSlug: dbGuide.slug,
    },

    success_url: `${origin}/guides/${dbGuide.slug}?success=true`,
    cancel_url:  `${origin}/guide/${dbGuide.slug}?cancelled=true`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
