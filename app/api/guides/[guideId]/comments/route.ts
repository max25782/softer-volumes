import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assertPurchasedGuide } from '@/lib/purchases'

interface RouteContext {
  params: Promise<{ guideId: string }>
}

export async function GET(_: Request, { params }: RouteContext) {
  const { guideId } = await params
  const comments = await prisma.guideComment.findMany({
    where: {
      guideId,
      status: 'approved',
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ comments })
}

export async function POST(req: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { guideId } = await params
  const json = (await req.json()) as { body?: unknown; placeId?: unknown }
  const body = typeof json.body === 'string' ? json.body.trim() : ''
  const placeId = typeof json.placeId === 'string' && json.placeId.length > 0 ? json.placeId : undefined

  if (body.length < 3 || body.length > 2000) {
    return NextResponse.json({ error: 'Comment must be between 3 and 2000 characters' }, { status: 400 })
  }

  try {
    await assertPurchasedGuide(session.user.id, guideId)
  } catch {
    return NextResponse.json({ error: 'Purchase required' }, { status: 403 })
  }

  if (placeId) {
    const place = await prisma.place.findFirst({
      where: { id: placeId, guideId },
      select: { id: true },
    })
    if (!place) return NextResponse.json({ error: 'Place not found for guide' }, { status: 404 })
  }

  const comment = await prisma.guideComment.create({
    data: {
      userId: session.user.id,
      guideId,
      placeId,
      body,
      status: 'approved',
    },
  })

  return NextResponse.json({ comment }, { status: 201 })
}
