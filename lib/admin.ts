import { auth } from '@/lib/auth'

export async function requireAdminSession() {
  const session = await auth()
  const role = session?.user?.role
  if (role !== 'admin' && role !== 'superadmin') return null
  return session
}
