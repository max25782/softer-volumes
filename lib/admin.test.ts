import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { requireAdminSession } from '@/lib/admin'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

interface MockPrisma {
  user: {
    findUnique: Mock
  }
}

const authMock = auth as Mock
const prismaMock = prisma as unknown as MockPrisma

describe('requireAdminSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects a stale JWT admin role when the database role was revoked', async () => {
    authMock.mockResolvedValue({
      user: {
        id: 'user_123',
        role: 'admin',
      },
    })
    prismaMock.user.findUnique.mockResolvedValue({ role: 'user' })

    await expect(requireAdminSession()).resolves.toBeNull()
  })

  it('allows the current database admin role and updates the returned session role', async () => {
    const session = {
      user: {
        id: 'user_123',
        role: 'user',
      },
    }
    authMock.mockResolvedValue(session)
    prismaMock.user.findUnique.mockResolvedValue({ role: 'superadmin' })

    await expect(requireAdminSession()).resolves.toBe(session)
    expect(session.user.role).toBe('superadmin')
  })
})
