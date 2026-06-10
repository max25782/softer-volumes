import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  guideFindFirst: vi.fn(),
  purchaseUpsert: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: {
      findFirst: mocks.guideFindFirst,
      update: vi.fn(),
    },
    guideRating: {
      aggregate: vi.fn(),
    },
    purchase: {
      findFirst: vi.fn(),
      upsert: mocks.purchaseUpsert,
    },
  },
}))

import { PurchaseValidationError, recordCompletedPurchase } from '@/lib/purchases'

const publishedGuide = {
  id: 'guide_123',
  slug: 'seoul',
  price: 10000,
  currency: 'usd',
}

describe('recordCompletedPurchase', () => {
  beforeEach(() => {
    mocks.guideFindFirst.mockReset()
    mocks.purchaseUpsert.mockReset()
  })

  it('rejects purchases for missing or unpublished guides before writing', async () => {
    mocks.guideFindFirst.mockResolvedValue(null)

    await expect(
      recordCompletedPurchase({
        userId: 'user_123',
        guideId: 'guide_123',
        amount: 10000,
        currency: 'usd',
        provider: 'paypal',
        externalId: 'capture_123',
      }),
    ).rejects.toBeInstanceOf(PurchaseValidationError)

    expect(mocks.purchaseUpsert).not.toHaveBeenCalled()
  })

  it('rejects amount and currency mismatches before writing', async () => {
    mocks.guideFindFirst.mockResolvedValue(publishedGuide)

    await expect(
      recordCompletedPurchase({
        userId: 'user_123',
        guideId: 'guide_123',
        amount: 5000,
        currency: 'usd',
        provider: 'paypal',
        externalId: 'capture_123',
      }),
    ).rejects.toThrow('amount')

    await expect(
      recordCompletedPurchase({
        userId: 'user_123',
        guideId: 'guide_123',
        amount: 10000,
        currency: 'eur',
        provider: 'paypal',
        externalId: 'capture_123',
      }),
    ).rejects.toThrow('currency')

    expect(mocks.purchaseUpsert).not.toHaveBeenCalled()
  })

  it('validates Stripe subtotal while recording the total paid amount', async () => {
    mocks.guideFindFirst.mockResolvedValue(publishedGuide)
    mocks.purchaseUpsert.mockResolvedValue({ id: 'purchase_123' })

    await recordCompletedPurchase({
      userId: 'user_123',
      guideId: 'guide_123',
      amount: 10825,
      expectedAmount: 10000,
      currency: 'USD',
      provider: 'stripe',
      externalId: 'pi_123',
    })

    expect(mocks.purchaseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          amount: 10825,
          currency: 'usd',
          stripePaymentId: 'pi_123',
        }),
        update: expect.objectContaining({
          amount: 10825,
          currency: 'usd',
          stripePaymentId: 'pi_123',
        }),
      }),
    )
  })
})
