import { describe, expect, it } from 'vitest'
import { getCompletedPayPalCaptureDetails, type PayPalCapture } from './paypal'
import { parsePurchaseBinding } from './purchases'

describe('parsePurchaseBinding', () => {
  it('extracts the user and guide IDs from PayPal custom_id', () => {
    expect(parsePurchaseBinding('user_123:guide_456')).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
    })
  })

  it('rejects missing or malformed purchase bindings', () => {
    expect(parsePurchaseBinding(undefined)).toBeNull()
    expect(parsePurchaseBinding('user_123')).toBeNull()
    expect(parsePurchaseBinding('user_123:')).toBeNull()
    expect(parsePurchaseBinding('user_123:guide_456:extra')).toBeNull()
  })
})

describe('getCompletedPayPalCaptureDetails', () => {
  it('returns trusted capture details from a completed PayPal capture', () => {
    const capture: PayPalCapture = {
      id: 'order_123',
      status: 'COMPLETED',
      purchase_units: [
        {
          custom_id: 'user_123:guide_456',
          payments: {
            captures: [
              {
                id: 'capture_123',
                status: 'COMPLETED',
                amount: {
                  value: '100.00',
                  currency_code: 'USD',
                },
              },
            ],
          },
        },
      ],
    }

    expect(getCompletedPayPalCaptureDetails(capture)).toEqual({
      customId: 'user_123:guide_456',
      externalId: 'capture_123',
      amount: 10000,
      currency: 'USD',
    })
  })

  it('rejects incomplete captures and captures without a purchase binding', () => {
    expect(getCompletedPayPalCaptureDetails({ id: 'order_123', status: 'APPROVED' })).toBeNull()

    expect(
      getCompletedPayPalCaptureDetails({
        id: 'order_123',
        status: 'COMPLETED',
        purchase_units: [
          {
            payments: {
              captures: [
                {
                  id: 'capture_123',
                  status: 'COMPLETED',
                  amount: {
                    value: '100.00',
                    currency_code: 'USD',
                  },
                },
              ],
            },
          },
        ],
      }),
    ).toBeNull()
  })
})
