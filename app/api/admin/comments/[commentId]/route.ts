import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ commentId: string }>
}

function isCommentStatus(value: unknown): value is 'pending' | 'approved' | 'rejected' | 'hidden' {
  return value === 'pending' || value === 'approved' || value === 'rejected' || value === 'hidden'
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { commentId } = await params
  const json = (await req.json()) as { status?: unknown }
  if (!isCommentStatus(json.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const comment = await prisma.guideComment.update({
    where: { id: commentId },
    data: { status: json.status },
  })

  return NextResponse.json({ comment })
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { commentId } = await params
  const comment = await prisma.guideComment.update({
    where: { id: commentId },
    data: {
      status: 'hidden',
      deletedAt: new Date(),
    },
  })

  return NextResponse.json({ comment })
}
