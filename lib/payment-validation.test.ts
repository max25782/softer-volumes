import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findGuideByIdOrSlug } from '@/lib/guides'
import { parsePayPalCustomId } from '@/lib/paypal'
import { recordCompletedPurchase } from '@/lib/purchases'

const mocks = vi.hoisted(() => ({
  guideFindFirst: vi.fn(),
  purchaseUpsert: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: {
      findFirst: mocks.guideFindFirst,
    },
    purchase: {
      upsert: mocks.purchaseUpsert,
    },
  },
}))

const dbGuide = {
  id: 'guide-db-id',
  slug: 'seoul',
  title: 'Seoul',
  subtitle: 'City Guide',
  tagline: 'Seoul',
  description: 'Published guide',
  coverImage: 'https://example.com/cover.jpg',
  heroImage: 'https://example.com/hero.jpg',
  price: 10000,
  currency: 'usd',
  isPublished: true,
  mapStyleUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  _count: { places: 12 },
}

describe('payment guide lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('falls back to the trusted slug when a mock guide id misses the database', async () => {
    mocks.guideFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(dbGuide)

    const guide = await findGuideByIdOrSlug({
      guideId: '1',
      guideSlug: 'seoul',
      publishedOnly: true,
    })

    expect(guide).toBe(dbGuide)
    expect(mocks.guideFindFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: '1', isPublished: true },
      }),
    )
    expect(mocks.guideFindFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { slug: 'seoul', isPublished: true },
      }),
    )
  })
})

describe('PayPal purchase metadata', () => {
  it('accepts exactly user and guide identifiers', () => {
    expect(parsePayPalCustomId('user-1:guide-1')).toEqual({
      userId: 'user-1',
      guideId: 'guide-1',
    })
  })

  it('rejects missing or malformed metadata', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('user-1')).toBeNull()
    expect(parsePayPalCustomId('user-1:guide-1:extra')).toBeNull()
  })
})

describe('recordCompletedPurchase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.guideFindFirst.mockResolvedValue({
      id: dbGuide.id,
      slug: dbGuide.slug,
      price: dbGuide.price,
      currency: dbGuide.currency,
    })
    mocks.purchaseUpsert.mockResolvedValue({
      id: 'purchase-1',
      guide: { slug: dbGuide.slug },
    })
  })

  it('refuses to write a purchase for a missing or unpublished guide', async () => {
    mocks.guideFindFirst.mockResolvedValueOnce(null)

    await expect(
      recordCompletedPurchase({
        userId: 'user-1',
        guideId: 'missing-guide',
        amount: 10000,
        currency: 'usd',
        provider: 'stripe',
        externalId: 'pi_1',
      }),
    ).rejects.toThrow('Purchase guide is not published')
    expect(mocks.purchaseUpsert).not.toHaveBeenCalled()
  })

  it('refuses underpaid provider captures', async () => {
    await expect(
      recordCompletedPurchase({
        userId: 'user-1',
        guideId: dbGuide.id,
        amount: 9999,
        currency: 'usd',
        provider: 'paypal',
        externalId: 'cap-1',
      }),
    ).rejects.toThrow('Purchase amount is below the published guide price')
    expect(mocks.purchaseUpsert).not.toHaveBeenCalled()
  })

  it('refuses currency mismatches', async () => {
    await expect(
      recordCompletedPurchase({
        userId: 'user-1',
        guideId: dbGuide.id,
        amount: 10000,
        currency: 'eur',
        provider: 'stripe',
        externalId: 'pi_1',
      }),
    ).rejects.toThrow('Purchase currency does not match')
    expect(mocks.purchaseUpsert).not.toHaveBeenCalled()
  })

  it('writes a validated purchase with normalized currency', async () => {
    await recordCompletedPurchase({
      userId: 'user-1',
      guideId: dbGuide.id,
      amount: 10000,
      currency: 'USD',
      provider: 'stripe',
      externalId: 'pi_1',
    })

    expect(mocks.purchaseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          currency: 'usd',
          guideId: dbGuide.id,
          stripePaymentId: 'pi_1',
        }),
        update: expect.objectContaining({
          currency: 'usd',
          stripePaymentId: 'pi_1',
        }),
      }),
    )
  })
})
