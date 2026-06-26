import { describe, expect, it } from 'vitest'
import {
  parseCompletedPayPalCapture,
  parsePayPalAmount,
  parsePayPalCustomId,
} from '../lib/paypal'

describe('PayPal purchase parsing', () => {
  it('parses trusted custom_id metadata', () => {
    expect(parsePayPalCustomId('user-123:guide-456')).toEqual({
      userId: 'user-123',
      guideId: 'guide-456',
    })
  })

  it('rejects malformed custom_id metadata', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('user-123')).toBeNull()
    expect(parsePayPalCustomId('user-123:guide-456:extra')).toBeNull()
    expect(parsePayPalCustomId(':guide-456')).toBeNull()
    expect(parsePayPalCustomId('user-123:')).toBeNull()
  })

  it('parses positive decimal amounts into cents', () => {
    expect(parsePayPalAmount('100.00')).toBe(10000)
    expect(parsePayPalAmount('12.34')).toBe(1234)
  })

  it('rejects missing, non-numeric, and non-positive amounts', () => {
    expect(parsePayPalAmount(undefined)).toBeNull()
    expect(parsePayPalAmount('not-a-number')).toBeNull()
    expect(parsePayPalAmount('0')).toBeNull()
    expect(parsePayPalAmount('-10.00')).toBeNull()
  })

  it('extracts completed purchase details from a captured PayPal order', () => {
    expect(
      parseCompletedPayPalCapture({
        id: 'order-123',
        status: 'COMPLETED',
        purchase_units: [
          {
            custom_id: 'user-123:guide-456',
            payments: {
              captures: [
                {
                  id: 'capture-123',
                  status: 'COMPLETED',
                  amount: { value: '100.00', currency_code: 'USD' },
                },
              ],
            },
          },
        ],
      }),
    ).toEqual({
      userId: 'user-123',
      guideId: 'guide-456',
      amount: 10000,
      currency: 'USD',
      externalId: 'capture-123',
    })
  })

  it('rejects incomplete PayPal captures', () => {
    expect(parseCompletedPayPalCapture({ id: 'order-123', status: 'APPROVED' })).toBeNull()
    expect(
      parseCompletedPayPalCapture({
        id: 'order-123',
        status: 'COMPLETED',
        purchase_units: [{ custom_id: 'user-123:guide-456' }],
      }),
    ).toBeNull()
  })
})
