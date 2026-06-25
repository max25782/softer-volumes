import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recordCompletedPurchase } from './purchases'

const prismaMock = vi.hoisted(() => ({
  guide: {
    findUnique: vi.fn(),
  },
  purchase: {
    upsert: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('recordCompletedPurchase', () => {
  beforeEach(() => {
    prismaMock.guide.findUnique.mockReset()
    prismaMock.purchase.upsert.mockReset()
  })

  it('rejects purchases for missing or unpublished guides', async () => {
    prismaMock.guide.findUnique.mockResolvedValueOnce(null)

    await expect(
      recordCompletedPurchase({
        userId: 'user_123',
        guideId: 'guide_456',
        amount: 10000,
        currency: 'usd',
        provider: 'stripe',
        externalId: 'pi_123',
      }),
    ).rejects.toThrow('Cannot record purchase')

    expect(prismaMock.purchase.upsert).not.toHaveBeenCalled()
  })

  it('rejects provider amounts that do not match the guide price', async () => {
    prismaMock.guide.findUnique.mockResolvedValueOnce({
      id: 'guide_456',
      price: 10000,
      currency: 'usd',
      isPublished: true,
    })

    await expect(
      recordCompletedPurchase({
        userId: 'user_123',
        guideId: 'guide_456',
        amount: 5000,
        currency: 'usd',
        provider: 'paypal',
        externalId: 'capture_123',
      }),
    ).rejects.toThrow('Payment amount does not match guide price')

    expect(prismaMock.purchase.upsert).not.toHaveBeenCalled()
  })

  it('records a purchase only after guide, amount, and currency validation pass', async () => {
    const purchase = { id: 'purchase_123' }
    prismaMock.guide.findUnique.mockResolvedValueOnce({
      id: 'guide_456',
      price: 10000,
      currency: 'usd',
      isPublished: true,
    })
    prismaMock.purchase.upsert.mockResolvedValueOnce(purchase)

    await expect(
      recordCompletedPurchase({
        userId: 'user_123',
        guideId: 'guide_456',
        amount: 10000,
        currency: 'USD',
        provider: 'paypal',
        externalId: 'capture_123',
      }),
    ).resolves.toBe(purchase)

    expect(prismaMock.purchase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          currency: 'usd',
          guideId: 'guide_456',
          paypalOrderId: 'capture_123',
          userId: 'user_123',
        }),
      }),
    )
  })
})
