import { describe, expect, it } from 'vitest'
import { parseCompletedPayPalPurchase, parsePayPalCustomId } from '@/lib/paypal'
import type { PayPalCapture } from '@/lib/paypal'

function createCompletedCapture(overrides: Partial<PayPalCapture> = {}): PayPalCapture {
  return {
    id: 'order_123',
    status: 'COMPLETED',
    purchase_units: [
      {
        custom_id: 'user_123:guide_456',
        payments: {
          captures: [
            {
              id: 'capture_789',
              status: 'COMPLETED',
              amount: { value: '100.00', currency_code: 'USD' },
            },
          ],
        },
      },
    ],
    ...overrides,
  }
}

describe('PayPal purchase parsing', () => {
  it('parses the user and guide from PayPal custom_id', () => {
    expect(parsePayPalCustomId('user_123:guide_456')).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
    })
  })

  it('rejects malformed custom_id values', () => {
    expect(parsePayPalCustomId()).toBeNull()
    expect(parsePayPalCustomId('')).toBeNull()
    expect(parsePayPalCustomId('user_123')).toBeNull()
    expect(parsePayPalCustomId('user_123:guide_456:extra')).toBeNull()
  })

  it('extracts a completed purchase only from PayPal-confirmed metadata', () => {
    expect(parseCompletedPayPalPurchase(createCompletedCapture())).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
      externalId: 'capture_789',
      amount: 10000,
      currency: 'USD',
    })
  })

  it('rejects incomplete captures and missing custom_id metadata', () => {
    expect(parseCompletedPayPalPurchase(createCompletedCapture({ status: 'APPROVED' }))).toBeNull()
    expect(
      parseCompletedPayPalPurchase({
        ...createCompletedCapture(),
        purchase_units: [{ payments: createCompletedCapture().purchase_units?.[0]?.payments }],
      }),
    ).toBeNull()
  })
})
