import { withAuth } from 'next-auth/middleware'

// Protect everything except the login page and the NextAuth API routes
export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
