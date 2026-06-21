import { describe, expect, it } from 'vitest'
import { assertPurchaseMatchesGuide } from './purchases'

const completedPurchase = {
  guideId: 'guide-1',
  amount: 10000,
  currency: 'usd',
}

const publishedGuide = {
  id: 'guide-1',
  price: 10000,
  currency: 'USD',
  isPublished: true,
}

describe('assertPurchaseMatchesGuide', () => {
  it('accepts a purchase that matches a published guide price and currency', () => {
    expect(() => assertPurchaseMatchesGuide(completedPurchase, publishedGuide)).not.toThrow()
  })

  it('rejects purchases for missing, unpublished, or mismatched guides', () => {
    expect(() => assertPurchaseMatchesGuide(completedPurchase, null)).toThrow(
      'Purchase guide is not available',
    )
    expect(() =>
      assertPurchaseMatchesGuide(completedPurchase, { ...publishedGuide, isPublished: false }),
    ).toThrow('Purchase guide is not available')
    expect(() =>
      assertPurchaseMatchesGuide(completedPurchase, { ...publishedGuide, id: 'guide-2' }),
    ).toThrow('Purchase guide is not available')
  })

  it('rejects purchases where the paid amount or currency differs from the guide', () => {
    expect(() =>
      assertPurchaseMatchesGuide({ ...completedPurchase, amount: 9999 }, publishedGuide),
    ).toThrow('Purchase amount does not match guide price')
    expect(() =>
      assertPurchaseMatchesGuide({ ...completedPurchase, currency: 'eur' }, publishedGuide),
    ).toThrow('Purchase amount does not match guide price')
  })
})
