import {
  ensureNextAuthUrlForOAuth,
  getConfiguredSiteUrl,
  getGoogleConsoleRedirectUris,
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

  let nextAuthProvidersGoogle: { signinUrl?: string; callbackUrl?: string } | null = null
  try {
    const providersRes = await fetch(new URL('/api/auth/providers', request.url), {
      headers: request.headers,
      cache: 'no-store',
    })
    const providers = (await providersRes.json()) as { google?: { signinUrl?: string; callbackUrl?: string } }
    nextAuthProvidersGoogle = providers.google ?? null
  } catch {
    nextAuthProvidersGoogle = null
  }

  return NextResponse.json({
    redirectUri,
    effectiveRedirectUri: `${effectiveAfterRequest}/api/auth/callback/google`,
    nextAuthProvidersGoogle,
    providersMustBeHttps:
      nextAuthProvidersGoogle?.callbackUrl?.startsWith('https://') ?? null,
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
      authorizedRedirectUris: getGoogleConsoleRedirectUris(),
      authorizedJavaScriptOrigins: [
        'https://arandanocafe.com',
        'https://www.arandanocafe.com',
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      note:
        'Copia effectiveRedirectUri en Google Cloud Console → Credentials → tu cliente OAuth → Authorized redirect URIs',
    },
  })
}
