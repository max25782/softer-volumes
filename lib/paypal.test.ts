import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getCompletedPayPalCaptureDetails,
  isExpectedPayPalCapture,
  parsePayPalAmountToCents,
  parsePayPalCustomId,
} from './paypal'
import type { PayPalCapture } from './paypal'

test('extracts completed PayPal capture details from order metadata', () => {
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

  const details = getCompletedPayPalCaptureDetails(capture)

  assert.deepEqual(details, {
    userId: 'user-1',
    guideId: 'guide-1',
    externalId: 'capture-1',
    amount: 10000,
    currency: 'USD',
  })
})

test('rejects malformed PayPal capture metadata', () => {
  assert.equal(parsePayPalCustomId('user-1'), null)
  assert.equal(parsePayPalCustomId('user-1:guide-1:extra'), null)
  assert.equal(parsePayPalAmountToCents('not-a-number'), null)
  assert.equal(parsePayPalAmountToCents('0'), null)

  const capture: PayPalCapture = {
    id: 'order-1',
    status: 'COMPLETED',
    purchase_units: [{ custom_id: 'user-1' }],
  }

  assert.equal(getCompletedPayPalCaptureDetails(capture), null)
})

test('validates PayPal capture against the expected purchaser and guide', () => {
  const details = {
    userId: 'user-1',
    guideId: 'guide-1',
    externalId: 'capture-1',
    amount: 10000,
    currency: 'USD',
  }

  assert.equal(
    isExpectedPayPalCapture(details, {
      userId: 'user-1',
      guideId: 'guide-1',
      amount: 10000,
      currency: 'usd',
    }),
    true,
  )

  assert.equal(
    isExpectedPayPalCapture(details, {
      userId: 'user-1',
      guideId: 'guide-2',
      amount: 10000,
      currency: 'usd',
    }),
    false,
  )
})
