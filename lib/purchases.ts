import { prisma } from '@/lib/prisma'

type PaymentProvider = 'stripe' | 'paypal'

export class PurchaseValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PurchaseValidationError'
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
  const currency = input.currency.toLowerCase()

  return prisma.$transaction(async (tx) => {
    const guide = await tx.guide.findFirst({
      where: { id: input.guideId, isPublished: true },
      select: { id: true, price: true, currency: true },
    })

    if (guide === null) {
      throw new PurchaseValidationError('Purchase guide was not found or is unpublished')
    }

    if (input.amount !== guide.price || currency !== guide.currency.toLowerCase()) {
      throw new PurchaseValidationError('Purchase amount or currency does not match the guide')
    }

    const existingPurchase = await tx.purchase.findUnique({
      where: {
        userId_guideId: {
          userId: input.userId,
          guideId: input.guideId,
        },
      },
      select: { status: true },
    })

    if (existingPurchase !== null && existingPurchase.status !== 'completed') {
      throw new PurchaseValidationError('Cannot overwrite a refunded or disputed purchase')
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
        currency,
        paymentProvider: input.provider,
        ...(input.provider === 'stripe'
          ? { stripePaymentId: input.externalId }
          : { paypalOrderId: input.externalId }),
      },
      create: {
        userId: input.userId,
        guideId: input.guideId,
        amount: input.amount,
        currency,
        paymentProvider: input.provider,
        ...(input.provider === 'stripe'
          ? { stripePaymentId: input.externalId }
          : { paypalOrderId: input.externalId }),
      },
      include: {
        guide: {
          select: { slug: true },
        },
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
