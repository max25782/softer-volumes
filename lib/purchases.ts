import { prisma } from '@/lib/prisma'

type PaymentProvider = 'stripe' | 'paypal'

async function verifyPurchaseMatchesGuide(input: {
  guideId: string
  amount: number
  currency: string
}) {
  const guide = await prisma.guide.findUnique({
    where: { id: input.guideId },
    select: {
      id: true,
      price: true,
      currency: true,
      isPublished: true,
    },
  })

  if (!guide?.isPublished) {
    throw new Error(`Cannot record purchase for unpublished or missing guide ${input.guideId}`)
  }

  if (guide.price !== input.amount) {
    throw new Error(`Purchase amount mismatch for guide ${input.guideId}`)
  }

  if (guide.currency.toLowerCase() !== input.currency.toLowerCase()) {
    throw new Error(`Purchase currency mismatch for guide ${input.guideId}`)
  }
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

export async function recordCompletedPurchase(input: {
  userId: string
  guideId: string
  amount: number
  currency: string
  provider: PaymentProvider
  externalId: string
}) {
  await verifyPurchaseMatchesGuide({
    guideId: input.guideId,
    amount: input.amount,
    currency: input.currency,
  })

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
