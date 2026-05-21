import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin-only routes
    if (path.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
      }
    }

    // Worker routes — WORKER or ADMIN
    if (path.startsWith('/worker')) {
      if (token?.role !== 'WORKER' && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        // Public paths — no token required
        const publicPaths = ['/', '/book', '/track']
        if (publicPaths.some((p) => path === p || path.startsWith(p + '/'))) return true
        if (path.startsWith('/receipt')) return true
        // Everything else needs a valid session
        return !!token
      },
    },
    pages: { signIn: '/login' },
  }
)

export const config = {
  matcher: [
    '/((?!login|api/|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|pdf)$).*)',
  ],
}
