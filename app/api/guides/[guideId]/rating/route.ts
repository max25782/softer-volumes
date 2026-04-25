import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertPurchasedGuide, recalculateGuideRating } from '@/lib/purchases'

interface RouteContext {
  params: Promise<{ guideId: string }>
}

function parseRating(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null
  if (value < 1 || value > 5) return null
  return value
}

export async function GET(_: Request, { params }: RouteContext) {
  const { guideId } = await params
  const guide = await prisma.guide.findUnique({
    where: { id: guideId },
    select: { id: true, ratingAvg: true, ratingCount: true },
  })

  if (!guide) return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
  return NextResponse.json(guide)
}

export async function POST(req: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { guideId } = await params
  const json = (await req.json()) as { value?: unknown }
  const value = parseRating(json.value)
  if (!value) {
    return NextResponse.json({ error: 'Rating must be an integer from 1 to 5' }, { status: 400 })
  }

  try {
    await assertPurchasedGuide(session.user.id, guideId)
  } catch {
    return NextResponse.json({ error: 'Purchase required' }, { status: 403 })
  }

  const rating = await prisma.guideRating.upsert({
    where: {
      userId_guideId: {
        userId: session.user.id,
        guideId,
      },
    },
    update: { value },
    create: {
      userId: session.user.id,
      guideId,
      value,
    },
  })

  const aggregate = await recalculateGuideRating(guideId)
  return NextResponse.json({ rating, aggregate })
}
