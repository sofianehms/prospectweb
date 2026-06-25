import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static assets and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: https://*.tile.openstreetmap.org https://*.googleapis.com",
    "font-src 'self'",
    `connect-src 'self' ${backendUrl}`,
    "frame-ancestors 'none'",
  ].join('; ')

  const response = NextResponse.next()

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-nonce', nonce)

  if (pathname === '/') {
    const token = req.cookies.get('pw_token')?.value
    if (token) return NextResponse.redirect(new URL('/dashboard', req.url))
    return response
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return response
  }

  const token = req.cookies.get('pw_token')?.value
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
