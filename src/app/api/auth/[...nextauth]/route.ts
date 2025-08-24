import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// Configuración directa de NextAuth para evitar problemas de importación
const authOptions = {
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

        try {
          // Usar fetch directo para evitar problemas de importación circular
          const supabaseUrl = 'https://aozysydpwvkkdvhfsvsu.supabase.co'
          const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvenlzeWRwd3Zra2R2aGZzdnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTQ5ODQsImV4cCI6MjA3MTM5MDk4NH0.TP4IcldIz855e-JETeychVPG60blKrxJ2oHkGSrVeaI'

          const response = await fetch(`${supabaseUrl}/rest/v1/User?email=eq.${credentials.email}&select=*`, {
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`
            }
          })

          if (!response.ok) {
            return null
          }

          const users = await response.json()
          const user = users[0]

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
