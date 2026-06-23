import { prisma } from '@/lib/prisma'

type PaymentProvider = 'stripe' | 'paypal'

interface CompletedPurchaseInput {
  userId: string
  guideId: string
  amount: number
  currency: string
  provider: PaymentProvider
  externalId: string
}

export interface PurchaseMetadata {
  userId: string
  guideId: string
}

export class PurchaseValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PurchaseValidationError'
  }
}

export function parsePurchaseMetadata(customId: string | null | undefined): PurchaseMetadata | null {
  if (!customId) return null

  const parts = customId.split(':')
  if (parts.length !== 2) return null

  const [userId, guideId] = parts
  if (!userId || !guideId) return null

  return { userId, guideId }
}

export function parseMajorAmountToCents(value: string | null | undefined): number | null {
  if (!value) return null

  const amount = Number(value)
  if (!Number.isFinite(amount)) return null

  const cents = Math.round(amount * 100)
  return cents > 0 ? cents : null
}

export async function hasCompletedPurchase(userId: string, guideId: string): Promise<boolean> {
  const purchase = await prisma.purchase.findFirst({
    where: {
      userId,
      guideId,
      status: 'completed',
    },
    select: { id: true },
  })

  return purchase !== null
}

export async function assertPurchasedGuide(userId: string, guideId: string): Promise<void> {
  const hasPurchase = await hasCompletedPurchase(userId, guideId)
  if (!hasPurchase) throw new Error('Purchase required')
}

async function validateCompletedPurchase(input: CompletedPurchaseInput): Promise<void> {
  const guide = await prisma.guide.findFirst({
    where: { id: input.guideId, isPublished: true },
    select: { price: true, currency: true },
  })

  if (!guide) throw new PurchaseValidationError('Guide not found')

  const currency = input.currency.toLowerCase()
  if (guide.currency.toLowerCase() !== currency) {
    throw new PurchaseValidationError('Purchase currency mismatch')
  }
  if (input.amount < guide.price) {
    throw new PurchaseValidationError('Purchase amount is below guide price')
  }
}

export async function recordCompletedPurchase(input: CompletedPurchaseInput) {
  await validateCompletedPurchase(input)

  return prisma.purchase.upsert({
    where: {
      userId_guideId: {
        userId: input.userId,
        guideId: input.guideId,
      },
    },
    update: {
      status: 'completed',
      amount: input.amount,
      currency: input.currency.toLowerCase(),
      paymentProvider: input.provider,
      refundedAt: null,
      ...(input.provider === 'stripe'
        ? { stripePaymentId: input.externalId }
        : { paypalOrderId: input.externalId }),
    },
    create: {
      userId: input.userId,
      guideId: input.guideId,
      amount: input.amount,
      currency: input.currency.toLowerCase(),
      paymentProvider: input.provider,
      ...(input.provider === 'stripe'
        ? { stripePaymentId: input.externalId }
        : { paypalOrderId: input.externalId }),
    },
  })
}

export async function recalculateGuideRating(guideId: string) {
  const aggregate = await prisma.guideRating.aggregate({
    where: { guideId },
    _avg: { value: true },
    _count: { value: true },
  })

  return prisma.guide.update({
    where: { id: guideId },
    data: {
      ratingAvg: aggregate._avg.value ?? 0,
      ratingCount: aggregate._count.value,
    },
    select: {
      id: true,
      ratingAvg: true,
      ratingCount: true,
    },
  })
}
