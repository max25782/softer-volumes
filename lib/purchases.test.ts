import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import {
  normalizeCurrency,
  recordCompletedPurchase,
  validatePublishedGuidePayment,
} from '@/lib/purchases'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: {
      findFirst: vi.fn(),
    },
    purchase: {
      upsert: vi.fn(),
    },
  },
}))

interface MockPrisma {
  guide: {
    findFirst: Mock
  }
  purchase: {
    upsert: Mock
  }
}

const prismaMock = prisma as unknown as MockPrisma

const guide = {
  id: 'guide_123',
  slug: 'seoul',
  price: 10000,
  currency: 'usd',
}

describe('purchase validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('normalizes provider currency codes before comparison and storage', () => {
    expect(normalizeCurrency(' USD ')).toBe('usd')
  })

  it('accepts a completed payment that matches a published guide price and currency', async () => {
    prismaMock.guide.findFirst.mockResolvedValue(guide)

    await expect(
      validatePublishedGuidePayment({
        guideId: guide.id,
        amount: 10000,
        currency: 'USD',
      }),
    ).resolves.toEqual(guide)
  })

  it('rejects payments for missing, unpublished, or mock-only guides', async () => {
    prismaMock.guide.findFirst.mockResolvedValue(null)

    await expect(
      validatePublishedGuidePayment({
        guideId: 'mock-guide-id',
        amount: 10000,
        currency: 'usd',
      }),
    ).rejects.toThrow('Published guide not found')
  })

  it('rejects payments whose amount or currency does not match the guide', async () => {
    prismaMock.guide.findFirst.mockResolvedValue(guide)

    await expect(
      validatePublishedGuidePayment({
        guideId: guide.id,
        amount: 5000,
        currency: 'usd',
      }),
    ).rejects.toThrow('Payment amount does not match guide price')

    await expect(
      validatePublishedGuidePayment({
        guideId: guide.id,
        amount: 10000,
        currency: 'eur',
      }),
    ).rejects.toThrow('Payment currency does not match guide currency')
  })

  it('validates guide price and currency before recording a purchase', async () => {
    prismaMock.guide.findFirst.mockResolvedValue(guide)
    prismaMock.purchase.upsert.mockResolvedValue({ id: 'purchase_123' })

    await recordCompletedPurchase({
      userId: 'user_123',
      guideId: guide.id,
      amount: 10000,
      currency: 'USD',
      provider: 'stripe',
      externalId: 'pi_123',
    })

    expect(prismaMock.purchase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          guideId: guide.id,
          amount: 10000,
          currency: 'usd',
          stripePaymentId: 'pi_123',
        }),
      }),
    )
  })
})
