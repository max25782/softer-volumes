import type { DefaultSession } from 'next-auth'

type UserRole = 'user' | 'admin' | 'superadmin'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole
  }
}
