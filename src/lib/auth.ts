import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './db'
import bcrypt from 'bcryptjs'

// Tipos para roles actualizados
type UserRole = 'ADMIN' | 'MANAGER' | 'ANALISTA' | 'VENDEDOR' | 'VIEWER'
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'

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

        // Intentar primero con la tabla nueva
        let user = await supabase.findUserByEmailNew(credentials.email)

        // Si no se encuentra, intentar con la tabla antigua
        if (!user) {
          const oldUser = await supabase.findUserByEmail(credentials.email)
          if (oldUser) {
            user = {
              id: oldUser.id,
              email: oldUser.email,
              nombre: oldUser.nombre,
              apellido: '',
              role: oldUser.rol,
              status: 'ACTIVE', // Asumir activo para usuarios existentes
              password_hash: oldUser.hash
            }
          }
        }

        if (!user) {
          return null
        }

        // Verificar contraseña
        let isPasswordValid = false

        if (user.password_hash) {
          isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash)
        } else {
          // Para usuarios sin hash, verificar contraseñas de prueba
          const testPasswords = ['admin123', 'analista123', 'vendedor123', 'password']
          isPasswordValid = testPasswords.includes(credentials.password)
        }

        if (!isPasswordValid) {
          return null
        }

        // Actualizar último login si la función existe
        try {
          await supabase.updateUserLastLogin(user.id)
        } catch (error) {
          // No se pudo actualizar último login
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.nombre} ${user.apellido || ''}`.trim(),
          role: user.role as UserRole,
          status: (user.status || 'ACTIVE') as UserStatus,
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
        token.status = user.status || 'ACTIVE' // Asegurar que siempre hay un status
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.status = (token.status || 'ACTIVE') as UserStatus // Asegurar que siempre hay un status
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin', // Redirigir errores a signin
  },
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      status: UserStatus
    }
  }

  interface User {
    role: UserRole
    status: UserStatus
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    status: UserStatus
  }
}
