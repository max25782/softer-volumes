# Softer Volumes — Premium City Guide Platform

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS (mobile-first) |
| Animation | Framer Motion |
| State | Redux Toolkit + RTK Query |
| Auth | NextAuth.js v5 — Google, Apple, Magic Link |
| Map | Mapbox GL JS |
| Backend | NestJS (separate repo) |
| Database | Supabase Postgres + Prisma ORM |
| Cache | Upstash Redis |
| Storage | AWS S3 + CloudFront |
| Payments | Stripe + PayPal |
| Email | Resend + React Email |
| Deploy | Vercel (frontend) + AWS ECS Fargate (backend) |

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in all values in .env.local

# 3. Set up database
pnpm prisma generate
pnpm prisma db push

# 4. Run development server
pnpm dev
```

## Project Structure

```
app/
├── (marketing)/          # Public pages — SSG, no auth required
│   ├── page.tsx          # Homepage with all guides
│   └── guides/[slug]/    # Guide landing page (product page)
│       └── page.tsx
├── (app)/                # Protected pages — auth required
│   ├── dashboard/        # My guides dashboard
│   │   └── page.tsx
│   └── guides/[slug]/    # Guide interior (after purchase)
│       └── page.tsx
├── auth/
│   └── signin/           # Sign in page
├── api/
│   ├── auth/             # NextAuth handler
│   ├── checkout/         # Stripe checkout session
│   └── webhooks/
│       └── stripe/       # Stripe webhook handler
components/
├── layout/               # Navbar, Footer
├── ui/                   # Reveal, Eyebrow, CategoryBadge, etc.
├── marketing/            # HeroSection, GuideCard, Marquee, Testimonials
└── guide/                # PlaceCard, GuideMap, GuideFilters, GuideExperience
lib/
├── auth.ts               # NextAuth config
├── fonts.ts              # Next/font config
├── types.ts              # Shared TypeScript types
└── utils.ts              # cn(), formatPrice(), mock data
prisma/
└── schema.prisma         # Database schema
```

## Key Features

### Purchase Flow
1. User visits `/guide/[slug]` — sees landing page
2. Clicks "Get Guide" → if not logged in, redirected to `/auth/signin`
3. After auth → Stripe Checkout opens (with Apple Pay / Google Pay)
4. Payment success → Stripe webhook fires → purchase saved to DB
5. User redirected to `/guides/[slug]` — guide is now unlocked

### Access Control
- `middleware.ts` protects all `/guides/*` and `/dashboard/*` routes
- Server components check purchase existence before rendering
- Caching via Redis: `purchase:{userId}:{guideId}` TTL 24h

### Photo Delivery
- Public photos (covers, previews) → S3 public bucket → CloudFront CDN
- Guide photos (after purchase) → S3 private bucket → CloudFront signed cookies
- Sharp processes uploads: original + 1200px + 600px + 400px WebP

## Environment Variables

See `.env.example` for all required variables.

## Deploy

### Frontend (Vercel)
```bash
vercel deploy
```

### Database migrations
```bash
pnpm prisma migrate deploy
```

## Customisation

Replace these placeholders before launch:
- `BRAND NAME` → actual brand name (search & replace)
- Hero images → actual photography
- Mock guide data in `lib/utils.ts` → real DB queries
- Mapbox style URL → custom style from Mapbox Studio
