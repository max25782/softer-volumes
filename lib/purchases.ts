import { prisma } from '@/lib/prisma'

type PaymentProvider = 'stripe' | 'paypal'

export class PurchaseValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PurchaseValidationError'
  }
}

function normalizeCurrency(currency: string): string {
  return currency.toLowerCase()
}

async function validateCompletedPurchase(input: {
  guideId: string
  amountToValidate: number
  currency: string
}) {
  const guide = await prisma.guide.findFirst({
    where: { id: input.guideId, isPublished: true },
    select: { id: true, price: true, currency: true, slug: true },
  })

  if (guide === null) {
    throw new PurchaseValidationError('Purchase guide was not found or is unpublished')
  }

  if (guide.price !== input.amountToValidate) {
    throw new PurchaseValidationError('Purchase amount does not match guide price')
  }

  if (normalizeCurrency(guide.currency) !== normalizeCurrency(input.currency)) {
    throw new PurchaseValidationError('Purchase currency does not match guide currency')
  }

  return guide
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
  expectedAmount?: number
  currency: string
  provider: PaymentProvider
  externalId: string
}) {
  await validateCompletedPurchase({
    guideId: input.guideId,
    amountToValidate: input.expectedAmount ?? input.amount,
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
      currency: normalizeCurrency(input.currency),
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
      currency: normalizeCurrency(input.currency),
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
