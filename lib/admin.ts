import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function requireAdminSession() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  const role = user?.role
  if (role !== 'admin' && role !== 'superadmin') return null
  return session
}
