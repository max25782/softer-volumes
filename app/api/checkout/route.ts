import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'
import { getStripe } from '@/lib/stripe'

function getTrustedOrigin(req: Request): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) return new URL(appUrl).origin
  return req.headers.get('origin') ?? 'http://localhost:3000'
}

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
  const guide = toGuide(dbGuide)

  const origin = getTrustedOrigin(req)

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
