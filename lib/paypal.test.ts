import { describe, expect, it } from 'vitest'
import { formatPurchaseMetadata, parsePurchaseMetadata } from '@/lib/paypal'

describe('PayPal purchase metadata', () => {
  it('round-trips user and guide IDs', () => {
    const metadata = formatPurchaseMetadata({
      userId: 'user_123',
      guideId: 'guide_456',
    })

    expect(parsePurchaseMetadata(metadata)).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
    })
  })

  it('rejects missing or malformed metadata', () => {
    expect(parsePurchaseMetadata(undefined)).toBeNull()
    expect(parsePurchaseMetadata('')).toBeNull()
    expect(parsePurchaseMetadata('user-only')).toBeNull()
    expect(parsePurchaseMetadata('user:guide:extra')).toBeNull()
    expect(parsePurchaseMetadata(':guide')).toBeNull()
    expect(parsePurchaseMetadata('user:')).toBeNull()
  })
})
