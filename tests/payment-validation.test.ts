import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { parsePayPalCustomId } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

const prismaMock = vi.hoisted(() => ({
  guide: {
    findFirst: vi.fn(),
  },
  purchase: {
    upsert: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

const dbGuide = {
  id: 'db-guide-id',
  slug: 'seoul',
  title: 'Seoul',
  subtitle: 'City Guide',
  tagline: '서울',
  description: 'A DB-backed guide',
  coverImage: 'https://images.example/cover.jpg',
  heroImage: 'https://images.example/hero.jpg',
  price: 10000,
  currency: 'usd',
  isPublished: true,
  mapStyleUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  _count: { places: 12 },
}

describe('payment guide resolution', () => {
  beforeEach(() => {
    prismaMock.guide.findFirst.mockReset()
    prismaMock.purchase.upsert.mockReset()
  })

  it('falls back to a published slug when a stale mock guide id misses', async () => {
    prismaMock.guide.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(dbGuide)

    const guide = await findGuideByIdOrSlug({
      guideId: '1',
      guideSlug: 'seoul',
      publishedOnly: true,
    })

    expect(guide).toEqual(dbGuide)
    expect(prismaMock.guide.findFirst).toHaveBeenNthCalledWith(1, {
      where: { id: '1', isPublished: true },
      include: { _count: { select: { places: true } } },
    })
    expect(prismaMock.guide.findFirst).toHaveBeenNthCalledWith(2, {
      where: { slug: 'seoul', isPublished: true },
      include: { _count: { select: { places: true } } },
    })
  })

  it('records only validated published-guide purchases', async () => {
    prismaMock.guide.findFirst.mockResolvedValue({ price: 10000, currency: 'usd' })
    prismaMock.purchase.upsert.mockResolvedValue({ id: 'purchase-id' })

    await recordCompletedPurchase({
      userId: 'user-id',
      guideId: 'db-guide-id',
      amount: 10000,
      currency: 'USD',
      provider: 'stripe',
      externalId: 'pi_123',
    })

    expect(prismaMock.purchase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_guideId: {
            userId: 'user-id',
            guideId: 'db-guide-id',
          },
        },
        create: expect.objectContaining({
          currency: 'usd',
          guideId: 'db-guide-id',
          userId: 'user-id',
        }),
      }),
    )
  })

  it('rejects underpaid purchase writes before upserting', async () => {
    prismaMock.guide.findFirst.mockResolvedValue({ price: 10000, currency: 'usd' })

    await expect(
      recordCompletedPurchase({
        userId: 'user-id',
        guideId: 'db-guide-id',
        amount: 9999,
        currency: 'usd',
        provider: 'paypal',
        externalId: 'paypal-capture-id',
      }),
    ).rejects.toThrow('Payment amount is lower than guide price')

    expect(prismaMock.purchase.upsert).not.toHaveBeenCalled()
  })
})

describe('PayPal custom metadata', () => {
  it('parses exactly one user id and guide id', () => {
    expect(parsePayPalCustomId('user-id:guide-id')).toEqual({
      userId: 'user-id',
      guideId: 'guide-id',
    })
  })

  it('rejects missing or malformed custom metadata', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('user-id')).toBeNull()
    expect(parsePayPalCustomId('user-id:guide-id:extra')).toBeNull()
  })
})
