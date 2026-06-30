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

async function assertPurchaseMatchesPublishedGuide(input: CompletedPurchaseInput) {
  const guide = await prisma.guide.findFirst({
    where: {
      id: input.guideId,
      isPublished: true,
    },
    select: {
      id: true,
      slug: true,
      price: true,
      currency: true,
    },
  })

  if (guide === null) {
    throw new Error('Purchase guide is not published')
  }

  if (input.amount < guide.price) {
    throw new Error('Purchase amount is below the published guide price')
  }

  if (input.currency.toLowerCase() !== guide.currency.toLowerCase()) {
    throw new Error('Purchase currency does not match the published guide currency')
  }

  return guide
}

export async function recordCompletedPurchase(input: CompletedPurchaseInput) {
  await assertPurchaseMatchesPublishedGuide(input)

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
    include: {
      guide: {
        select: {
          slug: true,
        },
      },
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
