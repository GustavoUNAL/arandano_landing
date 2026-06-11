import { authOptions } from '@/lib/auth'
import { ensureNextAuthUrlForOAuth } from '@/lib/auth-url'
import NextAuth from 'next-auth'
import type { NextRequest } from 'next/server'

type AuthRouteContext = { params: { nextauth: string[] } }

async function handleAuth(req: NextRequest, context: AuthRouteContext) {
  ensureNextAuthUrlForOAuth(req.headers)
  return NextAuth(authOptions)(req, context)
}

export async function GET(req: NextRequest, context: AuthRouteContext) {
  return handleAuth(req, context)
}

export async function POST(req: NextRequest, context: AuthRouteContext) {
  return handleAuth(req, context)
}
