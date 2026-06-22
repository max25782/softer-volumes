import { describe, expect, it } from 'vitest'
import { parsePayPalCustomId } from '@/lib/paypal'
import { isPaymentAmountSufficient } from '@/lib/purchases'

describe('PayPal purchase metadata parsing', () => {
  it('extracts the bound user and guide identifiers', () => {
    expect(parsePayPalCustomId('user_123:guide_456')).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
    })
  })

  it('rejects malformed or incomplete metadata', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('')).toBeNull()
    expect(parsePayPalCustomId('user_123')).toBeNull()
    expect(parsePayPalCustomId('user_123:')).toBeNull()
    expect(parsePayPalCustomId(':guide_456')).toBeNull()
    expect(parsePayPalCustomId('user_123:guide_456:extra')).toBeNull()
  })
})

describe('payment amount validation', () => {
  it('accepts exact-price and tax-inclusive payments', () => {
    expect(isPaymentAmountSufficient(10000, 10000)).toBe(true)
    expect(isPaymentAmountSufficient(10825, 10000)).toBe(true)
  })

  it('rejects underpayments and non-integer cent amounts', () => {
    expect(isPaymentAmountSufficient(9999, 10000)).toBe(false)
    expect(isPaymentAmountSufficient(10000.5, 10000)).toBe(false)
  })
})
