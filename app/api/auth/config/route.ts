import { getGoogleOAuthRedirectUri } from '@/lib/auth-url'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Diagnóstico OAuth — verifica qué redirect_uri envía la app a Google.
 * GET /api/auth/config (solo en producción muestra la URI esperada)
 */
export async function GET() {
  const redirectUri = getGoogleOAuthRedirectUri()
  const siteUrl = process.env.SITE_URL ?? null
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? null

  return NextResponse.json({
    redirectUri,
    siteUrl,
    nextAuthUrl,
    nodeEnv: process.env.NODE_ENV,
    authTrustHost: process.env.AUTH_TRUST_HOST ?? null,
    googleClientConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    googleConsoleChecklist: {
      authorizedRedirectUris: [
        'https://arandanocafe.com/api/auth/callback/google',
        'https://www.arandanocafe.com/api/auth/callback/google',
        'http://localhost:3000/api/auth/callback/google',
      ],
      authorizedJavaScriptOrigins: [
        'https://arandanocafe.com',
        'https://www.arandanocafe.com',
        'http://localhost:3000',
      ],
    },
  })
}
