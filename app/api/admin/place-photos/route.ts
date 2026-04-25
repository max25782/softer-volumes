import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { publicUrlForStorageKey } from '@/lib/storage'
import { createSupabaseAdminClient } from '@/utils/supabase/admin'

function parseRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key)
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} is required`)
  }
  return value.trim()
}

function parsePositiveInt(formData: FormData, key: string): number {
  const value = Number.parseInt(parseRequiredString(formData, key), 10)
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${key} must be positive`)
  return value
}

export async function POST(req: Request) {
  const session = await requireAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const bucket = process.env.SUPABASE_ASSETS_BUCKET
    if (!bucket) throw new Error('SUPABASE_ASSETS_BUCKET must be set')

    const formData = await req.formData()
    const placeId = parseRequiredString(formData, 'placeId')
    const alt = parseRequiredString(formData, 'alt')
    const width = parsePositiveInt(formData, 'width')
    const height = parsePositiveInt(formData, 'height')
    const sortOrderRaw = formData.get('sortOrder')
    const sortOrder =
      typeof sortOrderRaw === 'string' && sortOrderRaw !== ''
        ? Number.parseInt(sortOrderRaw, 10)
        : 0
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const place = await prisma.place.findUnique({
      where: { id: placeId },
      include: { guide: { select: { slug: true } } },
    })
    if (!place) return NextResponse.json({ error: 'Place not found' }, { status: 404 })

    const extension = file.name.split('.').pop()?.toLowerCase() || 'webp'
    const safeName = crypto.randomUUID()
    const s3Key = `guides/${place.guide.slug}/places/${place.id}/${safeName}.${extension}`
    const admin = createSupabaseAdminClient()
    const upload = await admin.storage.from(bucket).upload(s3Key, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

    if (upload.error) throw upload.error

    const photo = await prisma.placePhoto.create({
      data: {
        placeId,
        url: publicUrlForStorageKey(s3Key),
        s3Key,
        alt,
        width,
        height,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      },
    })

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
