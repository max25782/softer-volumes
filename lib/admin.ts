import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function requireAdminSession() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  const role = user?.role

  if (role !== 'admin' && role !== 'superadmin') return null
  return {
    ...session,
    user: {
      ...session.user,
      role,
    },
  }
}
