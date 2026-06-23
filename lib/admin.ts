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

  if (user?.role !== 'admin' && user?.role !== 'superadmin') return null
  return session
}
