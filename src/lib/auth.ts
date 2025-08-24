import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './db'
import bcrypt from 'bcryptjs'
// Tipos para roles
type Rol = 'ADMIN' | 'ANALISTA' | 'VENDEDOR'

export const authOptions: NextAuthOptions = {
  // Removemos el adapter de Prisma ya que usamos Supabase directamente
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await supabase.findUserByEmail(credentials.email)

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hash
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          role: user.rol as Rol,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as Rol
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Rol
    }
  }

  interface User {
    role: Rol
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Rol
  }
}
