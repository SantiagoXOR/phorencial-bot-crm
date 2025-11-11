import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './db'
import bcrypt from 'bcryptjs'

// Tipos para roles actualizados
type UserRole = 'ADMIN' | 'MANAGER' | 'ANALISTA' | 'VENDEDOR' | 'VIEWER'
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'

export const authOptions: NextAuthOptions = {
  // Removemos el adapter de Prisma ya que usamos Supabase directamente
  debug: true, // Habilitar debug para ver más logs
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata)
    }
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔍 Iniciando authorize con:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenciales faltantes')
          return null
        }

        try {
          // Intentar primero con la tabla nueva
          let user = await supabase.findUserByEmailNew(credentials.email)
          console.log('👤 Usuario encontrado:', !!user)

          // Si no se encuentra, intentar con la tabla antigua
          if (!user) {
            console.log('🔄 Intentando con tabla antigua...')
            const oldUser = await supabase.findUserByEmail(credentials.email)
            if (oldUser) {
              user = {
                id: oldUser.id,
                email: oldUser.email,
                nombre: oldUser.nombre,
                apellido: '',
                role: oldUser.rol,
                status: 'ACTIVE', // Asumir activo para usuarios existentes
                hash: oldUser.hash
              }
            }
          }

          if (!user) {
            console.log('❌ Usuario no encontrado')
            return null
          }

          console.log('🔑 Verificando contraseña...', { hasHash: !!user.hash })

          // Verificar contraseña
          let isPasswordValid = false

          if (user.hash) {
            isPasswordValid = await bcrypt.compare(credentials.password, user.hash)
            console.log('🔐 Resultado bcrypt:', isPasswordValid)
          } else {
            // Para usuarios sin hash, verificar contraseñas de prueba
            const testPasswords = ['admin123', 'analista123', 'vendedor123', 'password']
            isPasswordValid = testPasswords.includes(credentials.password)
            console.log('🔐 Resultado contraseña de prueba:', isPasswordValid)
          }

          if (!isPasswordValid) {
            console.log('❌ Contraseña inválida')
            return null
          }

          // Actualizar último login si la función existe
          try {
            await supabase.updateUserLastLogin(user.id)
          } catch (error) {
            console.log('⚠️ No se pudo actualizar último login:', error)
          }

          const result = {
            id: user.id,
            email: user.email,
            name: `${user.nombre} ${user.apellido || ''}`.trim(),
            role: user.role as UserRole,
            status: (user.status || 'ACTIVE') as UserStatus,
          }
          
          console.log('✅ Authorize exitoso:', { id: result.id, email: result.email, role: result.role })
          return result

        } catch (error: any) {
          console.error('❌ Error en authorize:', error.message)
          console.error('   Tipo de error:', error.constructor.name)
          console.error('   Stack:', error.stack)
          
          // Si es un error de conexión a Supabase, proporcionar mensaje específico
          if (error.message.includes('Error de conexión a Supabase')) {
            console.error('🔌 Error de conectividad con Supabase. Verifique la configuración de red.')
          }
          
          return null
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
