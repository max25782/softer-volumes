import { describe, expect, it } from 'vitest'
import { formatPayPalCustomId, parsePayPalCustomId } from './paypal'

describe('PayPal purchase metadata', () => {
  it('round-trips user and guide identifiers', () => {
    const customId = formatPayPalCustomId({
      userId: 'user_123',
      guideId: 'guide_456',
    })

    expect(parsePayPalCustomId(customId)).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
    })
  })

  it('rejects missing or malformed metadata', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('user-only')).toBeNull()
    expect(parsePayPalCustomId('user:')).toBeNull()
    expect(parsePayPalCustomId(':guide')).toBeNull()
    expect(parsePayPalCustomId('user:guide:extra')).toBeNull()
  })
})
