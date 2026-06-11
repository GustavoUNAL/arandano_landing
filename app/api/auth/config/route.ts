import {
  ensureNextAuthUrlForOAuth,
  getConfiguredSiteUrl,
  getGoogleOAuthRedirectUri,
  originFromHeaders,
} from '@/lib/auth-url'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Diagnóstico OAuth — verifica qué redirect_uri envía la app a Google.
 * GET /api/auth/config
 */
export async function GET(request: Request) {
  const redirectUri = getGoogleOAuthRedirectUri()
  const siteUrl = process.env.SITE_URL ?? null
  const nextAuthUrl = process.env.NEXTAUTH_URL ?? null
  const configuredSiteUrl = getConfiguredSiteUrl() ?? null
  const requestOrigin = originFromHeaders(request.headers) ?? null
  const effectiveAfterRequest = ensureNextAuthUrlForOAuth(request.headers)

  return NextResponse.json({
    redirectUri,
    effectiveRedirectUri: `${effectiveAfterRequest}/api/auth/callback/google`,
    siteUrl,
    nextAuthUrl,
    configuredSiteUrl,
    requestOrigin,
    xForwardedProto: request.headers.get('x-forwarded-proto'),
    xForwardedHost: request.headers.get('x-forwarded-host'),
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
