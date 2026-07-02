import { beforeEach, describe, expect, it, vi } from 'vitest'

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

import { recordCompletedPurchase } from '@/lib/purchases'

describe('recordCompletedPurchase', () => {
  beforeEach(() => {
    prismaMock.guide.findFirst.mockReset()
    prismaMock.purchase.upsert.mockReset()
  })

  it('records a purchase when the provider amount matches the published guide', async () => {
    prismaMock.guide.findFirst.mockResolvedValue({ price: 10000, currency: 'usd' })
    prismaMock.purchase.upsert.mockResolvedValue({ id: 'purchase-1' })

    await expect(
      recordCompletedPurchase({
        userId: 'user-1',
        guideId: 'guide-1',
        amount: 10000,
        currency: 'USD',
        provider: 'stripe',
        externalId: 'payment-1',
      }),
    ).resolves.toEqual({ id: 'purchase-1' })

    expect(prismaMock.purchase.upsert).toHaveBeenCalledOnce()
  })

  it('rejects a purchase when the paid amount does not match the guide price', async () => {
    prismaMock.guide.findFirst.mockResolvedValue({ price: 10000, currency: 'usd' })

    await expect(
      recordCompletedPurchase({
        userId: 'user-1',
        guideId: 'guide-1',
        amount: 5000,
        currency: 'USD',
        provider: 'paypal',
        externalId: 'capture-1',
      }),
    ).rejects.toThrow('Purchase amount or currency does not match guide')

    expect(prismaMock.purchase.upsert).not.toHaveBeenCalled()
  })

  it('rejects purchases for unpublished or missing guides', async () => {
    prismaMock.guide.findFirst.mockResolvedValue(null)

    await expect(
      recordCompletedPurchase({
        userId: 'user-1',
        guideId: 'guide-1',
        amount: 10000,
        currency: 'USD',
        provider: 'stripe',
        externalId: 'payment-1',
      }),
    ).rejects.toThrow('Published guide not found for purchase')

    expect(prismaMock.purchase.upsert).not.toHaveBeenCalled()
  })
}
