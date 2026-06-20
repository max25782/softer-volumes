import { describe, expect, it } from 'vitest'
import { parsePayPalCustomId } from '@/lib/paypal'

describe('parsePayPalCustomId', () => {
  it('extracts the trusted purchase binding from PayPal metadata', () => {
    expect(parsePayPalCustomId('user_123:guide_456')).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
    })
  })

  it('rejects missing or malformed PayPal metadata', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('user_123')).toBeNull()
    expect(parsePayPalCustomId('user_123:')).toBeNull()
    expect(parsePayPalCustomId(':guide_456')).toBeNull()
    expect(parsePayPalCustomId('user_123:guide_456:extra')).toBeNull()
  })
})
