import { describe, expect, it } from 'vitest'
import { getCompletedPayPalCapture, parsePayPalCustomId } from './paypal'

describe('parsePayPalCustomId', () => {
  it('parses user and guide IDs from PayPal metadata', () => {
    expect(parsePayPalCustomId('user_123:guide_456')).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
    })
  })

  it('rejects malformed metadata', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('user-only')).toBeNull()
    expect(parsePayPalCustomId('user:guide:extra')).toBeNull()
    expect(parsePayPalCustomId(':guide')).toBeNull()
    expect(parsePayPalCustomId('user:')).toBeNull()
  })
})

describe('getCompletedPayPalCapture', () => {
  it('extracts completed capture details from trusted PayPal fields', () => {
    const capture = getCompletedPayPalCapture({
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
                amount: { value: '100.00', currency_code: 'USD' },
              },
            ],
          },
        },
      ],
    })

    expect(capture).toEqual({
      amount: 10000,
      currency: 'USD',
      customId: {
        userId: 'user_123',
        guideId: 'guide_456',
      },
      externalId: 'capture_123',
    })
  })

  it('rejects captures without completed payment metadata', () => {
    expect(
      getCompletedPayPalCapture({
        id: 'order_123',
        status: 'COMPLETED',
        purchase_units: [
          {
            custom_id: 'user_123:guide_456',
            payments: {
              captures: [
                {
                  id: 'capture_123',
                  status: 'PENDING',
                  amount: { value: '100.00', currency_code: 'USD' },
                },
              ],
            },
          },
        ],
      }),
    ).toBeNull()

    expect(
      getCompletedPayPalCapture({
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
                  amount: { value: '0.00', currency_code: 'USD' },
                },
              ],
            },
          },
        ],
      }),
    ).toBeNull()
  })
})
