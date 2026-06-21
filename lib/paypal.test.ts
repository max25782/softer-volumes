import { describe, expect, it } from 'vitest'
import { getPayPalCapturePurchase, parsePayPalCustomId } from './paypal'

describe('parsePayPalCustomId', () => {
  it('parses the user and guide identifiers from PayPal metadata', () => {
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
    expect(parsePayPalCustomId('user-1:')).toBeNull()
  })
})

describe('getPayPalCapturePurchase', () => {
  it('uses captured PayPal metadata and amount as the purchase source of truth', () => {
    const purchase = getPayPalCapturePurchase({
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
    })

    expect(purchase).toEqual({
      externalId: 'capture-1',
      amount: 10000,
      currency: 'USD',
      metadata: { userId: 'user-1', guideId: 'guide-1' },
    })
  })
})
