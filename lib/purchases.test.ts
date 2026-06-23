import { describe, expect, it } from 'vitest'
import { parseMajorAmountToCents, parsePurchaseMetadata } from './purchases'

describe('parsePurchaseMetadata', () => {
  it('extracts the trusted user and guide identifiers from provider metadata', () => {
    expect(parsePurchaseMetadata('user_123:guide_456')).toEqual({
      userId: 'user_123',
      guideId: 'guide_456',
    })
  })

  it('rejects malformed provider metadata', () => {
    expect(parsePurchaseMetadata(undefined)).toBeNull()
    expect(parsePurchaseMetadata('')).toBeNull()
    expect(parsePurchaseMetadata('user_123')).toBeNull()
    expect(parsePurchaseMetadata('user_123:')).toBeNull()
    expect(parsePurchaseMetadata(':guide_456')).toBeNull()
    expect(parsePurchaseMetadata('user_123:guide_456:extra')).toBeNull()
  })
})

describe('parseMajorAmountToCents', () => {
  it('converts major currency units to cents', () => {
    expect(parseMajorAmountToCents('100')).toBe(10000)
    expect(parseMajorAmountToCents('19.99')).toBe(1999)
  })

  it('rejects missing, non-numeric, and non-positive amounts', () => {
    expect(parseMajorAmountToCents(undefined)).toBeNull()
    expect(parseMajorAmountToCents('not-a-number')).toBeNull()
    expect(parseMajorAmountToCents('0')).toBeNull()
    expect(parseMajorAmountToCents('-1')).toBeNull()
  })
})
