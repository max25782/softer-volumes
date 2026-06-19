import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdminRole(role: string | undefined): role is 'admin' | 'superadmin' {
  return role === 'admin' || role === 'superadmin'
}

export async function requireAdminSession() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!isAdminRole(user?.role)) return null

  session.user.role = user.role
  return session
}
