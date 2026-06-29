import { beforeEach, describe, expect, it, vi } from 'vitest'

const guideFindFirst = vi.hoisted(() => vi.fn())

vi.mock('@/lib/prisma', () => ({
  prisma: {
    guide: {
      findFirst: guideFindFirst,
    },
  },
}))

import { findGuideByIdOrSlug, toGuide } from '@/lib/guides'

function createDbGuide(overrides: Partial<Parameters<typeof toGuide>[0]> = {}) {
  return {
    id: 'guide-db-id',
    slug: 'seoul',
    title: 'Seoul',
    subtitle: 'City Guide',
    tagline: '서울',
    description: 'A guide to Seoul.',
    coverImage: 'https://example.com/cover.jpg',
    heroImage: 'https://example.com/hero.jpg',
    price: 10000,
    currency: 'usd',
    isPublished: true,
    mapStyleUrl: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    _count: { places: 12 },
    ...overrides,
  }
}

describe('findGuideByIdOrSlug', () => {
  beforeEach(() => {
    guideFindFirst.mockReset()
  })

  it('falls back to a published slug when a stale marketing guide id misses', async () => {
    const guide = createDbGuide()
    guideFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(guide)

    await expect(
      findGuideByIdOrSlug({
        guideId: '1',
        guideSlug: 'seoul',
        publishedOnly: true,
      }),
    ).resolves.toBe(guide)

    expect(guideFindFirst).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: '1', isPublished: true },
      }),
    )
    expect(guideFindFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { slug: 'seoul', isPublished: true },
      }),
    )
  })
})

describe('toGuide', () => {
  it('preserves database slugs outside the original mock city list', () => {
    expect(toGuide(createDbGuide({ slug: 'kyoto' })).slug).toBe('kyoto')
  })
})
