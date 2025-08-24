import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isProtectedPage = ['/leads', '/reports', '/settings'].some(path =>
      req.nextUrl.pathname.startsWith(path)
    )

    // Si está autenticado y trata de acceder a auth, redirigir a leads
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/leads', req.url))
    }

    // Si no está autenticado y trata de acceder a páginas protegidas
    if (!isAuth && isProtectedPage) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url)
      )
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => true, // Permitir acceso, el middleware maneja la lógica
    },
  }
)

export const config = {
  matcher: [
    '/leads/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/auth/signin',
  ],
}
