import type { NextRequest } from 'next/server'

const LOCALHOST_RE = /localhost|127\.0\.0\.1/i

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '')
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/** Origen canónico para OAuth (SITE_URL tiene prioridad sobre NEXTAUTH_URL localhost). */
export function getConfiguredSiteUrl(): string | undefined {
  const candidates = [
    process.env.SITE_URL?.trim(),
    process.env.NEXT_PUBLIC_SITE_URL?.trim(),
    process.env.NEXTAUTH_URL?.trim(),
  ].filter((v): v is string => Boolean(v))

  for (const raw of candidates) {
    const origin = normalizeOrigin(raw)
    if (isProduction() && LOCALHOST_RE.test(origin)) continue
    return origin
  }

  return undefined
}

/** Fija NEXTAUTH_URL al arrancar en producción (evita redirect_uri_mismatch). */
export function bootstrapNextAuthUrl(): string | undefined {
  const configured = getConfiguredSiteUrl()
  if (configured) {
    process.env.NEXTAUTH_URL = configured
    return configured
  }

  if (isProduction()) {
    const current = process.env.NEXTAUTH_URL ?? ''
    if (!current || LOCALHOST_RE.test(current)) {
      console.error(
        '[auth] Producción sin SITE_URL/NEXTAUTH_URL público. ' +
          'Define SITE_URL=https://arandanocafe.com en .env.local y reinicia PM2.'
      )
    }
  }

  return process.env.NEXTAUTH_URL
}

export function getGoogleOAuthRedirectUri(): string {
  bootstrapNextAuthUrl()
  const base = getConfiguredSiteUrl() ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  return `${normalizeOrigin(base)}/api/auth/callback/google`
}

export function shouldTrustRequestHost(): boolean {
  if (process.env.AUTH_TRUST_HOST === 'true') return true
  if (process.env.AUTH_TRUST_HOST === 'false') return false
  return process.env.NODE_ENV === 'production'
}

export function originFromHeaders(headers: Headers): string | undefined {
  const forwardedHost = headers.get('x-forwarded-host')
  const host =
    forwardedHost?.split(',')[0]?.trim() || headers.get('host')?.split(',')[0]?.trim()
  if (!host) return undefined

  const forwardedProto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const proto = forwardedProto || (LOCALHOST_RE.test(host) ? 'http' : 'https')

  return normalizeOrigin(`${proto}://${host}`)
}

export function resolvePublicOrigin(headers?: Headers): string {
  const configured = getConfiguredSiteUrl()
  if (configured) return configured

  if (headers && shouldTrustRequestHost()) {
    const fromRequest = originFromHeaders(headers)
    if (fromRequest && !(isProduction() && LOCALHOST_RE.test(fromRequest))) {
      return fromRequest
    }
  }

  return 'http://localhost:3000'
}

export function applyNextAuthUrl(origin: string): string {
  const normalized = normalizeOrigin(origin)
  const current = process.env.NEXTAUTH_URL ?? ''

  if (shouldTrustRequestHost() || LOCALHOST_RE.test(current) || !current) {
    process.env.NEXTAUTH_URL = normalized
  }

  return process.env.NEXTAUTH_URL ?? normalized
}

export function applyNextAuthUrlFromRequest(req: NextRequest): string {
  return applyNextAuthUrl(resolvePublicOrigin(req.headers))
}

export function applyNextAuthUrlFromHeaders(headers: Headers): string {
  return applyNextAuthUrl(resolvePublicOrigin(headers))
}

export function usesSecureCookies(): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return (getConfiguredSiteUrl() ?? '').startsWith('https://')
  }
  const configured = getConfiguredSiteUrl() ?? ''
  if (configured.startsWith('https://')) return true
  if (shouldTrustRequestHost()) return true
  return !LOCALHOST_RE.test(configured)
}
