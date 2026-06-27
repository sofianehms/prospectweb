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

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''} https://*.clerk.accounts.dev https://clerk.nosite.fr https://challenges.cloudflare.com https://cdn.mxpnl.com https://va.vercel-scripts.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://img.clerk.com`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.nosite.fr https://clerk-telemetry.com https://*.mixpanel.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.tile.openstreetmap.org https://va.vercel-scripts.com`,
    `frame-src https://challenges.cloudflare.com https://js.stripe.com`,
    `worker-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join('; ')
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  if (pathname === '/') {
    const { userId } = await auth()
    if (userId) return NextResponse.redirect(new URL('/dashboard', req.url))
  } else if (!isPublicRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const nonce = generateNonce()
  const csp = buildCsp(nonce)

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)

  return response
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
