import { describe, expect, it } from 'vitest'
import { parsePayPalCustomId } from '@/lib/paypal'

describe('parsePayPalCustomId', () => {
  it('extracts trusted purchase metadata from a PayPal custom id', () => {
    expect(parsePayPalCustomId('user-id:guide-id')).toEqual({
      userId: 'user-id',
      guideId: 'guide-id',
    })
  })

  it('rejects malformed custom ids', () => {
    expect(parsePayPalCustomId(undefined)).toBeNull()
    expect(parsePayPalCustomId('user-id')).toBeNull()
    expect(parsePayPalCustomId('user-id:')).toBeNull()
    expect(parsePayPalCustomId('user-id:guide-id:extra')).toBeNull()
  })
})
