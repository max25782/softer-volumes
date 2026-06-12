import { describe, expect, it } from 'vitest'
import { getCompletedPayPalPurchase, parsePayPalCustomId } from './paypal'

describe('parsePayPalCustomId', () => {
  it('extracts the user and guide IDs from trusted PayPal metadata', () => {
    expect(parsePayPalCustomId('user_123:guide_456')).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
    })
  })

  it('rejects missing or malformed PayPal metadata', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('user_123')).toBeNull()
    expect(parsePayPalCustomId('user_123:')).toBeNull()
    expect(parsePayPalCustomId(':guide_456')).toBeNull()
    expect(parsePayPalCustomId('user_123:guide_456:extra')).toBeNull()
  })
})

describe('getCompletedPayPalPurchase', () => {
  it('returns purchase details only from completed PayPal capture metadata', () => {
    expect(
      getCompletedPayPalPurchase({
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
      }),
    ).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
      captureId: 'capture_789',
      amount: 10000,
      currency: 'USD',
    })
  })

  it('rejects completed captures that lack trusted guide metadata', () => {
    expect(
      getCompletedPayPalPurchase({
        id: 'order_123',
        status: 'COMPLETED',
        purchase_units: [
          {
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
      }),
    ).toBeNull()
  })

  it('rejects captures that are not fully completed', () => {
    expect(
      getCompletedPayPalPurchase({
        id: 'order_123',
        status: 'APPROVED',
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
      }),
    ).toBeNull()

    expect(
      getCompletedPayPalPurchase({
        id: 'order_123',
        status: 'COMPLETED',
        purchase_units: [
          {
            custom_id: 'user_123:guide_456',
            payments: {
              captures: [
                {
                  id: 'capture_789',
                  status: 'PENDING',
                  amount: { value: '100.00', currency_code: 'USD' },
                },
              ],
            },
          },
        ],
      }),
    ).toBeNull()
  })
})
