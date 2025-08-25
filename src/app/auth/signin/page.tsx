'use client'

import { useState, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('from') || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciales inválidas')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      setError('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Card className="w-full max-w-md formosa-card hover-lift">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold gradient-text">
            CRM Phorencial
          </CardTitle>
          <CardDescription className="text-gray-600">
            Accede al sistema de gestión de leads de Formosa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} method="post" className="space-y-4" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="email-input"
                className="transition-all focus:ring-2 focus:ring-blue-500"
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="password-input"
                className="transition-all focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full gradient-primary hover-lift transition-all duration-200"
              disabled={isLoading}
              data-testid="login-button"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Información de usuarios de prueba */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Usuarios de prueba:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>ADMIN:</strong> admin@phorencial.com / admin123</div>
              <div><strong>ANALISTA:</strong> analista@phorencial.com / analista123</div>
              <div><strong>VENDEDOR:</strong> vendedor@phorencial.com / vendedor123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <SignInForm />
    </Suspense>
  )
}
