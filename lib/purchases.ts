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

function providerExternalIdField(provider: PaymentProvider) {
  return provider === 'stripe' ? 'stripePaymentId' : 'paypalOrderId'
}

export async function recordCompletedPurchase(input: CompletedPurchaseInput) {
  const normalizedCurrency = input.currency.toLowerCase()

  return prisma.$transaction(async (tx) => {
    const guide = await tx.guide.findFirst({
      where: { id: input.guideId, isPublished: true },
      select: { price: true, currency: true },
    })

    if (guide === null) {
      throw new Error(`Purchase guide not found or unpublished: ${input.guideId}`)
    }

    if (guide.currency.toLowerCase() !== normalizedCurrency || input.amount < guide.price) {
      throw new Error(`Purchase payment mismatch for guide: ${input.guideId}`)
    }

    const existingPurchase = await tx.purchase.findUnique({
      where: {
        userId_guideId: {
          userId: input.userId,
          guideId: input.guideId,
        },
      },
      select: {
        status: true,
        stripePaymentId: true,
        paypalOrderId: true,
      },
    })

    if (existingPurchase?.status === 'refunded' || existingPurchase?.status === 'disputed') {
      const externalIdField = providerExternalIdField(input.provider)
      if (existingPurchase[externalIdField] === input.externalId) {
        throw new Error(`Purchase cannot be completed from a ${existingPurchase.status} payment`)
      }
    }

    return tx.purchase.upsert({
      where: {
        userId_guideId: {
          userId: input.userId,
          guideId: input.guideId,
        },
      },
      update: {
        status: 'completed',
        amount: input.amount,
        currency: normalizedCurrency,
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
        currency: normalizedCurrency,
        paymentProvider: input.provider,
        ...(input.provider === 'stripe'
          ? { stripePaymentId: input.externalId }
          : { paypalOrderId: input.externalId }),
      },
    })
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
