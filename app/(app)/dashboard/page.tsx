import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { formatPrice, formatDate } from '@/lib/utils'
import { Reveal, Eyebrow } from '@/components/ui'

export const metadata: Metadata = {
  title: 'My Guides',
}

// In production: fetch from DB via Prisma
async function getPurchases(userId: string) {
  // return await prisma.purchase.findMany({
  //   where: { userId },
  //   include: { guide: true },
  //   orderBy: { createdAt: 'desc' },
  // })

  // Mock data for development
  return [
    {
      id: 'p1',
      guideId: '1',
      amount: 10000,
      currency: 'usd',
      createdAt: new Date().toISOString(),
      guide: {
        id: '1',
        slug: 'seoul',
        title: 'Seoul',
        tagline: '서울',
        subtitle: 'City Guide',
        coverImage:
          'https://images.unsplash.com/photo-1601850494422-3cf14624b0b3?w=800&q=80',
        placeCount: 120,
      },
    },
  ]
}

export default async function DashboardPage() {
  const session = await auth()
  const purchases = await getPurchases(session!.user!.id as string)
  const hasPurchases = purchases.length > 0

  return (
    <div className="section max-w-6xl mx-auto">

      {/* Header */}
      <Reveal className="mb-16">
        <Eyebrow>My Account</Eyebrow>
        <h1
          className="font-display font-light leading-tight mt-2"
          style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}
        >
          Welcome back,<br />
          <em className="text-gold">
            {session?.user?.name?.split(' ')[0] ?? 'Traveller'}
          </em>
        </h1>
      </Reveal>

      {hasPurchases ? (
        <>
          <Reveal className="mb-8">
            <h2 className="font-display text-2xl font-normal text-ink">
              Your Guides
            </h2>
            <p className="text-caption text-mist mt-1">
              {purchases.length} guide{purchases.length !== 1 ? 's' : ''} unlocked
            </p>
          </Reveal>

          {/* Guides grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {purchases.map((purchase, i) => (
              <Reveal key={purchase.id} delay={(i % 3) as 0 | 1 | 2}>
                <Link href={`/guides/${purchase.guide.slug}`}>
                  <article className="group card-hover border border-gold/10 overflow-hidden">

                    {/* Cover */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <div className="absolute inset-0">
                        <Image
                          src={purchase.guide.coverImage}
                          alt={purchase.guide.title}
                          fill
                          className="object-cover img-sepia transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(to top, rgba(10,9,6,0.6) 0%, transparent 60%)',
                        }}
                      />
                      <div className="absolute top-4 right-4 bg-gold text-ink text-[8px] tracking-[0.25em] uppercase px-2 py-1">
                        Unlocked
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="font-korean text-xl text-paper/40 mb-1">
                          {purchase.guide.tagline}
                        </p>
                        <h3 className="font-display text-3xl font-light text-paper">
                          {purchase.guide.title}
                        </h3>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="px-5 py-4 flex items-center justify-between border-t border-gold/10">
                      <span className="text-[9px] tracking-[0.25em] uppercase text-mist">
                        {purchase.guide.placeCount}+ places
                      </span>
                      <span className="text-[9px] tracking-[0.2em] uppercase text-gold group-hover:tracking-[0.3em] transition-all duration-300">
                        Open →
                      </span>
                    </div>
                  </article>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* Browse more */}
          <Reveal className="border-t border-gold/15 pt-12">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl font-normal text-ink mb-1">
                  Explore More Cities
                </h3>
                <p className="text-caption text-mist">
                  New guides added regularly
                </p>
              </div>
              <Link href="/#guides" className="btn-primary">
                <span>View All Guides</span>
                <span>→</span>
              </Link>
            </div>
          </Reveal>
        </>
      ) : (
        /* Empty state */
        <Reveal className="flex flex-col items-center justify-center py-32 text-center">
          <p className="font-display text-6xl font-light text-gold/20 mb-6">✦</p>
          <h2 className="font-display text-3xl font-light text-ink mb-3">
            No guides yet
          </h2>
          <p className="text-caption text-mist mb-10 max-w-sm">
            Your unlocked city guides will appear here after purchase.
          </p>
          <Link href="/#guides" className="btn-primary">
            <span>Explore Guides</span>
            <span>→</span>
          </Link>
        </Reveal>
      )}

      {/* Purchase history */}
      {hasPurchases && (
        <Reveal className="mt-8">
          <h3 className="font-display text-xl font-normal text-ink mb-6">
            Purchase History
          </h3>
          <div className="border border-gold/15">
            <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-gold/10">
              {['Guide', 'Date', 'Amount', 'Status'].map((h) => (
                <span key={h} className="text-eyebrow text-mist/50">{h}</span>
              ))}
            </div>
            {purchases.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-gold/8 hover:bg-gold/3 transition-colors"
              >
                <span className="font-display text-lg text-ink">
                  {p.guide.title}
                </span>
                <span className="text-caption text-mist self-center">
                  {formatDate(p.createdAt)}
                </span>
                <span className="font-display text-lg text-gold self-center">
                  {formatPrice(p.amount, p.currency)}
                </span>
                <span className="self-center">
                  <span className="text-[8px] tracking-[0.2em] uppercase text-emerald-600 bg-emerald-50 px-2 py-1">
                    Paid
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </div>
  )
}
