import { withAuth } from 'next-auth/middleware'

// Only protect UI pages — API routes handle their own auth via getServerSession.
// Redirecting API calls to /login converts POST → GET → 405 Method Not Allowed.
export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: [
    // Match all paths EXCEPT: login, any /api/* route, Next.js internals, static files
    '/((?!login|api/|_next/static|_next/image|favicon.ico).*)',
  ],
}
