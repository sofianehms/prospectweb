import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/privacy(.*)',
  '/api/auth(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  // Static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // CSP nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.clerk.accounts.dev https://challenges.cloudflare.com`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: https://*.tile.openstreetmap.org https://*.googleapis.com https://img.clerk.com",
    "font-src 'self'",
    `connect-src 'self' ${backendUrl} https://*.clerk.accounts.dev`,
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
  ].join('; ')

  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-nonce', nonce)

  // Redirect logged-in users from / to /dashboard
  if (pathname === '/') {
    const { userId } = await auth()
    if (userId) return NextResponse.redirect(new URL('/dashboard', req.url))
    return response
  }

  if (isPublicRoute(req)) {
    return response
  }

  // Protect non-public routes
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  return response
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
}
