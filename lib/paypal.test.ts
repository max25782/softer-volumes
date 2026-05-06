import assert from 'node:assert/strict'
import test from 'node:test'
import { getCompletedPayPalCaptureDetails, type PayPalCapture } from './paypal'

function createCapture(overrides: Partial<PayPalCapture> = {}): PayPalCapture {
  return {
    id: 'order_123',
    status: 'COMPLETED',
    purchase_units: [
      {
        custom_id: 'user_1:guide_1',
        payments: {
          captures: [
            {
              id: 'capture_123',
              status: 'COMPLETED',
              amount: { value: '25.00', currency_code: 'USD' },
            },
          ],
        },
      },
    ],
    ...overrides,
  }
}

test('returns completed PayPal capture details when metadata matches', () => {
  assert.deepEqual(
    getCompletedPayPalCaptureDetails(createCapture(), {
      userId: 'user_1',
      guideId: 'guide_1',
    }),
    {
      userId: 'user_1',
      guideId: 'guide_1',
      externalId: 'capture_123',
      amount: 2500,
      currency: 'USD',
    }
  )
})

test('rejects PayPal captures for a different guide', () => {
  assert.equal(
    getCompletedPayPalCaptureDetails(createCapture(), {
      userId: 'user_1',
      guideId: 'guide_2',
    }),
    null
  )
})

test('rejects PayPal captures for a different user', () => {
  assert.equal(
    getCompletedPayPalCaptureDetails(createCapture(), {
      userId: 'user_2',
      guideId: 'guide_1',
    }),
    null
  )
})

test('rejects incomplete PayPal captures', () => {
  assert.equal(
    getCompletedPayPalCaptureDetails(
      createCapture({
        purchase_units: [
          {
            custom_id: 'user_1:guide_1',
            payments: {
              captures: [
                {
                  id: 'capture_123',
                  status: 'PENDING',
                  amount: { value: '25.00', currency_code: 'USD' },
                },
              ],
            },
          },
        ],
      }),
      {
        userId: 'user_1',
        guideId: 'guide_1',
      }
    ),
    null
  )
})
