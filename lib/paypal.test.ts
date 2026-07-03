import { describe, expect, it } from 'vitest'
import {
  getCompletedPayPalCapture,
  parsePayPalCustomId,
  type PayPalCapture,
} from './paypal'

describe('parsePayPalCustomId', () => {
  it('extracts the user and guide from PayPal order metadata', () => {
    expect(parsePayPalCustomId('user-1:guide-1')).toEqual({
      userId: 'user-1',
      guideId: 'guide-1',
    })
  })

  it('rejects missing or malformed metadata', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('user-1')).toBeNull()
    expect(parsePayPalCustomId('user-1:guide-1:extra')).toBeNull()
    expect(parsePayPalCustomId(':guide-1')).toBeNull()
  })
})

describe('getCompletedPayPalCapture', () => {
  it('returns trusted capture details from PayPal metadata', () => {
    const capture: PayPalCapture = {
      id: 'order-1',
      status: 'COMPLETED',
      purchase_units: [
        {
          custom_id: 'user-1:guide-1',
          payments: {
            captures: [
              {
                id: 'capture-1',
                status: 'COMPLETED',
                amount: { value: '100.00', currency_code: 'USD' },
              },
            ],
          },
        },
      ],
    }

    expect(getCompletedPayPalCapture(capture)).toEqual({
      externalId: 'capture-1',
      userId: 'user-1',
      guideId: 'guide-1',
      amount: 10000,
      currency: 'USD',
    })
  })

  it('rejects captures that cannot be tied back to provider metadata', () => {
    const capture: PayPalCapture = {
      id: 'order-1',
      status: 'COMPLETED',
      purchase_units: [
        {
          payments: {
            captures: [
              {
                id: 'capture-1',
                status: 'COMPLETED',
                amount: { value: '100.00', currency_code: 'USD' },
              },
            ],
          },
        },
      ],
    }

    expect(getCompletedPayPalCapture(capture)).toBeNull()
  })
})
