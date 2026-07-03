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

import { recordCompletedPurchase } from './purchases'

describe('recordCompletedPurchase', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('records a purchase only after validating the published guide price', async () => {
    prismaMock.guide.findFirst.mockResolvedValue({
      id: 'guide-1',
      price: 10000,
      currency: 'usd',
    })
    prismaMock.purchase.upsert.mockResolvedValue({ id: 'purchase-1' })

    await expect(
      recordCompletedPurchase({
        userId: 'user-1',
        guideId: 'guide-1',
        amount: 10000,
        currency: 'USD',
        provider: 'stripe',
        externalId: 'pi_1',
      }),
    ).resolves.toEqual({ id: 'purchase-1' })

    expect(prismaMock.purchase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          guideId: 'guide-1',
          amount: 10000,
          currency: 'usd',
        }),
      }),
    )
  })

  it('rejects underpaid provider events before writing a purchase', async () => {
    prismaMock.guide.findFirst.mockResolvedValue({
      id: 'guide-1',
      price: 10000,
      currency: 'usd',
    })

    await expect(
      recordCompletedPurchase({
        userId: 'user-1',
        guideId: 'guide-1',
        amount: 100,
        currency: 'USD',
        provider: 'paypal',
        externalId: 'capture-1',
      }),
    ).rejects.toThrow('Payment amount or currency does not match guide price')

    expect(prismaMock.purchase.upsert).not.toHaveBeenCalled()
  })

  it('rejects missing or unpublished guides before writing a purchase', async () => {
    prismaMock.guide.findFirst.mockResolvedValue(null)

    await expect(
      recordCompletedPurchase({
        userId: 'user-1',
        guideId: 'missing-guide',
        amount: 10000,
        currency: 'USD',
        provider: 'stripe',
        externalId: 'pi_1',
      }),
    ).rejects.toThrow('Cannot record purchase for an unpublished or missing guide')

    expect(prismaMock.purchase.upsert).not.toHaveBeenCalled()
  })
})
