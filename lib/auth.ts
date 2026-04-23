import { PrismaAdapter } from '@auth/prisma-adapter'
import { UserRole } from '@prisma/client'
import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Apple from 'next-auth/providers/apple'
import { prisma } from '@/lib/prisma'

const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV !== 'production'
    ? 'softer-volumes-local-dev-secret-min-32-chars!'
    : undefined)

const nextAuthConfig: NextAuthConfig = {
  // Required for /api/auth on localhost and many hosts; set AUTH_TRUST_HOST=false to opt out
  trustHost: process.env.AUTH_TRUST_HOST !== 'false',
  secret: authSecret,

  adapter: PrismaAdapter(prisma) as NextAuthConfig['adapter'],

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Apple({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
    // Resend({ apiKey: process.env.RESEND_API_KEY!, from: 'noreply@yourdomain.com' }),
  ],

  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      session.user.role = (token.role as UserRole | undefined) ?? 'user'
      return session
    },
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.sub = user.id
        const row = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        token.role = row?.role ?? 'user'
      } else if (token.sub) {
        if (trigger === 'update' || !token.role) {
          const row = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true },
          })
          if (row) token.role = row.role
        }
      }
      return token
    },
  },

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(nextAuthConfig)
