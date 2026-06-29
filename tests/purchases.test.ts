import { beforeEach, describe, expect, it, vi } from 'vitest'

const guideFindFirst = vi.hoisted(() => vi.fn())
const purchaseUpsert = vi.hoisted(() => vi.fn())

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: {
      findFirst: guideFindFirst,
    },
    purchase: {
      upsert: purchaseUpsert,
    },
  },
}))

import { recordCompletedPurchase } from '@/lib/purchases'

const validPurchase = {
  userId: 'user-id',
  guideId: 'guide-id',
  amount: 10000,
  currency: 'USD',
  provider: 'stripe' as const,
  externalId: 'pi_123',
}

describe('recordCompletedPurchase', () => {
  beforeEach(() => {
    guideFindFirst.mockReset()
    purchaseUpsert.mockReset()
  })

  it('rejects payments for missing or unpublished guides before writing purchases', async () => {
    guideFindFirst.mockResolvedValueOnce(null)

    await expect(recordCompletedPurchase(validPurchase)).rejects.toThrow(
      'Cannot record purchase for unpublished or missing guide',
    )

    expect(purchaseUpsert).not.toHaveBeenCalled()
  })

  it('rejects underpaid captures before writing purchases', async () => {
    guideFindFirst.mockResolvedValueOnce({
      id: 'guide-id',
      price: 10000,
      currency: 'usd',
    })

    await expect(
      recordCompletedPurchase({
        ...validPurchase,
        amount: 9999,
      }),
    ).rejects.toThrow('Payment amount is lower than guide price')

    expect(purchaseUpsert).not.toHaveBeenCalled()
  })

  it('normalizes currency and records a completed purchase after validation', async () => {
    const purchase = { id: 'purchase-id' }
    guideFindFirst.mockResolvedValueOnce({
      id: 'guide-id',
      price: 10000,
      currency: 'usd',
    })
    purchaseUpsert.mockResolvedValueOnce(purchase)

    await expect(recordCompletedPurchase(validPurchase)).resolves.toBe(purchase)

    expect(purchaseUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ currency: 'usd' }),
        update: expect.objectContaining({ currency: 'usd' }),
      }),
    )
  })
})
