import { authOptions } from '@/lib/auth'
import { applyNextAuthUrlFromRequest, bootstrapNextAuthUrl } from '@/lib/auth-url'
import NextAuth from 'next-auth'
import type { NextRequest } from 'next/server'

bootstrapNextAuthUrl()

const handler = NextAuth(authOptions)

type AuthRouteContext = { params: { nextauth: string[] } }

async function withPublicUrl(
  req: NextRequest,
  context: AuthRouteContext
) {
  applyNextAuthUrlFromRequest(req)
  return handler(req, context)
}

export async function GET(req: NextRequest, context: AuthRouteContext) {
  return withPublicUrl(req, context)
}

export async function POST(req: NextRequest, context: AuthRouteContext) {
  return withPublicUrl(req, context)
}
