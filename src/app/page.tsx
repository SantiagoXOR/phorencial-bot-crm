'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirigir al dashboard si el usuario está autenticado
  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <h1 className="text-4xl font-bold text-center mb-8">
            Phorencial CRM
          </h1>
          <p className="text-center text-lg text-muted-foreground">
            Cargando...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-center">
        <h1 className="text-4xl font-bold mb-8">
          Phorencial CRM
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Sistema de gestión de leads integrado con WhatsApp Business
        </p>

        {session ? (
          <div className="space-y-4">
            <p className="text-green-600">
              Bienvenido, {session.user.name}!
            </p>
            <Button asChild>
              <Link href="/dashboard">
                Ir al Dashboard
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Inicia sesión para acceder al CRM
            </p>
            <Button asChild>
              <Link href="/auth/signin">
                Iniciar Sesión
              </Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
