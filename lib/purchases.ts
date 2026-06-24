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

interface PurchasableGuide {
  id: string
  price: number
  currency: string
  isPublished: boolean
}

interface ValidatedPurchaseAmount {
  amount: number
  currency: string
}

function purchaseValidationError(message: string): Error {
  const error = new Error(message)
  error.name = 'PurchaseValidationError'
  return error
}

export function isPurchaseValidationError(error: unknown): error is Error {
  return error instanceof Error && error.name === 'PurchaseValidationError'
}

export function validateCompletedPurchaseForGuide(
  input: Pick<CompletedPurchaseInput, 'guideId' | 'amount' | 'currency'>,
  guide: PurchasableGuide | null,
): ValidatedPurchaseAmount {
  if (guide === null || guide.id !== input.guideId || !guide.isPublished) {
    throw purchaseValidationError('Guide is not available for purchase')
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw purchaseValidationError('Purchase amount must be a positive integer')
  }

  const paidCurrency = input.currency.toLowerCase()
  const guideCurrency = guide.currency.toLowerCase()

  if (paidCurrency !== guideCurrency) {
    throw purchaseValidationError('Purchase currency does not match guide currency')
  }

  if (input.amount < guide.price) {
    throw purchaseValidationError('Purchase amount is lower than guide price')
  }

  return {
    amount: input.amount,
    currency: paidCurrency,
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

export async function recordCompletedPurchase(input: CompletedPurchaseInput) {
  const guide = await prisma.guide.findUnique({
    where: { id: input.guideId },
    select: {
      id: true,
      price: true,
      currency: true,
      isPublished: true,
    },
  })
  const validated = validateCompletedPurchaseForGuide(input, guide)

  return prisma.purchase.upsert({
    where: {
      userId_guideId: {
        userId: input.userId,
        guideId: input.guideId,
      },
    },
    update: {
      status: 'completed',
      amount: validated.amount,
      currency: validated.currency,
      paymentProvider: input.provider,
      refundedAt: null,
      ...(input.provider === 'stripe'
        ? { stripePaymentId: input.externalId }
        : { paypalOrderId: input.externalId }),
    },
    create: {
      userId: input.userId,
      guideId: input.guideId,
      amount: validated.amount,
      currency: validated.currency,
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
