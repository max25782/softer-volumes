import { Prisma, type PaymentProvider, type PurchaseStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const terminalPurchaseStatuses: PurchaseStatus[] = ['refunded', 'disputed']

interface CompletedPurchaseInput {
  userId: string
  guideId: string
  amount: number
  currency: string
  provider: PaymentProvider
  externalId: string
}

function completedPurchaseData(input: CompletedPurchaseInput) {
  return {
    status: 'completed' as PurchaseStatus,
    amount: input.amount,
    currency: input.currency.toLowerCase(),
    paymentProvider: input.provider,
    refundedAt: null,
    stripePaymentId: input.provider === 'stripe' ? input.externalId : null,
    paypalOrderId: input.provider === 'paypal' ? input.externalId : null,
  }
}

function sameTerminalProviderPaymentWhere(input: CompletedPurchaseInput) {
  return {
    status: { in: terminalPurchaseStatuses },
    paymentProvider: input.provider,
    ...(input.provider === 'stripe'
      ? { stripePaymentId: input.externalId }
      : { paypalOrderId: input.externalId }),
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
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
  const where = {
    userId_guideId: {
      userId: input.userId,
      guideId: input.guideId,
    },
  }
  const data = completedPurchaseData(input)

  return prisma.$transaction(async (tx) => {
    const updated = await tx.purchase.updateMany({
      where: {
        userId: input.userId,
        guideId: input.guideId,
        NOT: sameTerminalProviderPaymentWhere(input),
      },
      data,
    })

    if (updated.count > 0) {
      return tx.purchase.findUniqueOrThrow({ where })
    }

    const existing = await tx.purchase.findUnique({ where })
    if (existing) return existing

    try {
      return await tx.purchase.create({
        data: {
          userId: input.userId,
          guideId: input.guideId,
          ...data,
        },
      })
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error
      return tx.purchase.findUniqueOrThrow({ where })
    }
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
