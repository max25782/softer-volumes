import { describe, expect, it } from 'vitest'
import { parsePayPalCustomId } from '@/lib/paypal'

describe('parsePayPalCustomId', () => {
  it('returns the user and guide IDs for valid metadata', () => {
    expect(parsePayPalCustomId('user_123:guide_456')).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
    })
  })

  it('rejects missing or malformed metadata', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('')).toBeNull()
    expect(parsePayPalCustomId('user_123')).toBeNull()
    expect(parsePayPalCustomId('user_123:')).toBeNull()
    expect(parsePayPalCustomId(':guide_456')).toBeNull()
    expect(parsePayPalCustomId('user_123:guide_456:extra')).toBeNull()
  })
})
