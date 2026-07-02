import { describe, expect, it } from 'vitest'
import {
  getCompletedPayPalCaptureDetails,
  type PayPalCapture,
} from '@/lib/paypal'

describe('getCompletedPayPalCaptureDetails', () => {
  it('extracts purchase details from completed provider metadata', () => {
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

    expect(getCompletedPayPalCaptureDetails(capture)).toEqual({
      userId: 'user-1',
      guideId: 'guide-1',
      amount: 10000,
      currency: 'USD',
      externalId: 'capture-1',
    })
  })

  it('rejects captures without exact ownership metadata', () => {
    const capture: PayPalCapture = {
      id: 'order-1',
      status: 'COMPLETED',
      purchase_units: [
        {
          custom_id: 'user-1:guide-1:extra',
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

    expect(getCompletedPayPalCaptureDetails(capture)).toBeNull()
  })
}
