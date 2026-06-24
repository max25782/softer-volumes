import { describe, expect, it } from 'vitest'
import { isPurchaseValidationError, validateCompletedPurchaseForGuide } from '@/lib/purchases'

const publishedGuide = {
  id: 'guide_123',
  price: 10000,
  currency: 'usd',
  isPublished: true,
}

describe('completed purchase validation', () => {
  it('accepts paid provider data that matches the published guide', () => {
    expect(
      validateCompletedPurchaseForGuide(
        { guideId: 'guide_123', amount: 10000, currency: 'USD' },
        publishedGuide,
      ),
    ).toEqual({ amount: 10000, currency: 'usd' })
  })

  it('rejects unknown, unpublished, or mismatched guides', () => {
    expect(() =>
      validateCompletedPurchaseForGuide(
        { guideId: 'guide_123', amount: 10000, currency: 'usd' },
        null,
      ),
    ).toThrow('Guide is not available for purchase')

    expect(() =>
      validateCompletedPurchaseForGuide(
        { guideId: 'other_guide', amount: 10000, currency: 'usd' },
        publishedGuide,
      ),
    ).toThrow('Guide is not available for purchase')

    expect(() =>
      validateCompletedPurchaseForGuide(
        { guideId: 'guide_123', amount: 10000, currency: 'usd' },
        { ...publishedGuide, isPublished: false },
      ),
    ).toThrow('Guide is not available for purchase')
  })

  it('rejects underpaid or wrong-currency provider captures', () => {
    expect(() =>
      validateCompletedPurchaseForGuide(
        { guideId: 'guide_123', amount: 9999, currency: 'usd' },
        publishedGuide,
      ),
    ).toThrow('Purchase amount is lower than guide price')

    expect(() =>
      validateCompletedPurchaseForGuide(
        { guideId: 'guide_123', amount: 10000, currency: 'eur' },
        publishedGuide,
      ),
    ).toThrow('Purchase currency does not match guide currency')
  })

  it('marks validation failures for webhook handling', () => {
    try {
      validateCompletedPurchaseForGuide(
        { guideId: 'guide_123', amount: 0, currency: 'usd' },
        publishedGuide,
      )
    } catch (error) {
      expect(isPurchaseValidationError(error)).toBe(true)
    }
  })
})
