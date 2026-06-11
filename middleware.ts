import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const LOCALHOST_RE = /localhost|127\.0\.0\.1/i

/**
 * Nginx hace proxy_pass a Node por HTTP y envía x-forwarded-proto: http.
 * NextAuth usa ese header para armar callbackUrl → Google recibe http y falla.
 */
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next()
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  if (!host || LOCALHOST_RE.test(host)) {
    return NextResponse.next()
  }

  const requestHeaders = new Headers(request.headers)
  if (requestHeaders.get('x-forwarded-proto') !== 'https') {
    requestHeaders.set('x-forwarded-proto', 'https')
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: '/api/auth/:path*',
}
