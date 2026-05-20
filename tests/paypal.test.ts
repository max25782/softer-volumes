import { describe, expect, it } from 'vitest'
import {
  getCompletedPayPalCaptureDetails,
  parsePayPalCustomId,
  type PayPalCapture,
} from '../lib/paypal'

function completedCapture(overrides: Partial<PayPalCapture> = {}): PayPalCapture {
  return {
    id: 'order-123',
    status: 'COMPLETED',
    purchase_units: [
      {
        custom_id: 'user-123:guide-123',
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
    ...overrides,
  }
}

describe('parsePayPalCustomId', () => {
  it('extracts the server-bound user and guide identifiers', () => {
    expect(parsePayPalCustomId('user-123:guide-123')).toEqual({
      userId: 'user-123',
      guideId: 'guide-123',
    })
  })

  it('rejects missing or malformed custom IDs', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('user-123')).toBeNull()
    expect(parsePayPalCustomId('user-123:')).toBeNull()
    expect(parsePayPalCustomId('user-123:guide-123:extra')).toBeNull()
  })
})

describe('getCompletedPayPalCaptureDetails', () => {
  it('derives purchase details from PayPal custom_id and capture amount', () => {
    expect(getCompletedPayPalCaptureDetails(completedCapture())).toEqual({
      userId: 'user-123',
      guideId: 'guide-123',
      amount: 10000,
      currency: 'USD',
      externalId: 'capture-123',
    })
  })

  it('accepts custom_id from the payment capture representation', () => {
    expect(
      getCompletedPayPalCaptureDetails(
        completedCapture({
          purchase_units: [
            {
              payments: {
                captures: [
                  {
                    id: 'capture-123',
                    status: 'COMPLETED',
                    custom_id: 'user-123:guide-123',
                    amount: { value: '100.00', currency_code: 'USD' },
                  },
                ],
              },
            },
          ],
        }),
      ),
    ).toEqual({
      userId: 'user-123',
      guideId: 'guide-123',
      amount: 10000,
      currency: 'USD',
      externalId: 'capture-123',
    })
  })

  it('rejects captures that are not completed', () => {
    expect(getCompletedPayPalCaptureDetails(completedCapture({ status: 'APPROVED' }))).toBeNull()
    expect(
      getCompletedPayPalCaptureDetails(
        completedCapture({
          purchase_units: [
            {
              custom_id: 'user-123:guide-123',
              payments: {
                captures: [
                  {
                    id: 'capture-123',
                    status: 'PENDING',
                    amount: { value: '100.00', currency_code: 'USD' },
                  },
                ],
              },
            },
          ],
        }),
      ),
    ).toBeNull()
  })

  it('rejects captures without trustworthy custom_id or amount data', () => {
    expect(
      getCompletedPayPalCaptureDetails(
        completedCapture({
          purchase_units: [
            {
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
      ),
    ).toBeNull()

    expect(
      getCompletedPayPalCaptureDetails(
        completedCapture({
          purchase_units: [
            {
              custom_id: 'user-123:guide-123',
              payments: {
                captures: [
                  {
                    id: 'capture-123',
                    status: 'COMPLETED',
                    amount: { value: 'not-a-number', currency_code: 'USD' },
                  },
                ],
              },
            },
          ],
        }),
      ),
    ).toBeNull()
  })
})
