import { describe, expect, it } from 'vitest'
import { doesPaymentMatchGuide } from '@/lib/purchases'

const publishedGuide = {
  id: 'guide_123',
  price: 10000,
  currency: 'usd',
  isPublished: true,
}

describe('doesPaymentMatchGuide', () => {
  it('accepts exact amount and currency matches for published guides', () => {
    expect(
      doesPaymentMatchGuide({
        guide: publishedGuide,
        amount: 10000,
        currency: 'USD',
      }),
    ).toBe(true)
  })

  it('rejects unpublished guides, amount mismatches, and currency mismatches', () => {
    expect(
      doesPaymentMatchGuide({
        guide: { ...publishedGuide, isPublished: false },
        amount: 10000,
        currency: 'usd',
      }),
    ).toBe(false)

    expect(
      doesPaymentMatchGuide({
        guide: publishedGuide,
        amount: 9999,
        currency: 'usd',
      }),
    ).toBe(false)

    expect(
      doesPaymentMatchGuide({
        guide: publishedGuide,
        amount: 10000,
        currency: 'eur',
      }),
    ).toBe(false)
  })
})
