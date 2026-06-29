import type { NextRequest } from 'next/server'

const LOCALHOST_RE = /localhost|127\.0\.0\.1/i

const DEFAULT_PRODUCTION_ORIGINS = [
  'https://arandanocafe.com',
  'https://www.arandanocafe.com',
]

function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, '')
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

function devDefaultOrigin(): string {
  const port = process.env.PORT?.trim() || '3000'
  return `http://localhost:${port}`
}

function parseExtraOrigins(): string[] {
  const raw = process.env.AUTH_ALLOWED_ORIGINS?.trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((o) => canonicalizeOrigin(o.trim()))
    .filter(Boolean)
}

export function getAllowedOAuthOrigins(): string[] {
  const origins = new Set<string>([...DEFAULT_PRODUCTION_ORIGINS, ...parseExtraOrigins()])
  if (isDevelopment()) {
    origins.add(devDefaultOrigin())
    origins.add('http://localhost:3000')
    origins.add('http://localhost:3001')
    origins.add('http://127.0.0.1:3000')
    origins.add('http://127.0.0.1:3001')
  }
  return [...origins]
}

function isLocalhostOrigin(origin: string): boolean {
  return LOCALHOST_RE.test(canonicalizeOrigin(origin))
}

function isAllowedOAuthOrigin(origin: string): boolean {
  const normalized = canonicalizeOrigin(origin)
  if (isDevelopment() && isLocalhostOrigin(normalized)) return true
  return getAllowedOAuthOrigins().includes(normalized)
}

function getDevelopmentSiteUrl(): string {
  const raw =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim()
  if (raw) return canonicalizeOrigin(raw)
  return devDefaultOrigin()
}

function canonicalizeOrigin(url: string): string {
  let origin = normalizeOrigin(url.trim())
  if (isProduction() && !LOCALHOST_RE.test(origin) && origin.startsWith('http://')) {
    origin = origin.replace(/^http:\/\//, 'https://')
  }
  return origin
}

export function getConfiguredSiteUrl(): string | undefined {
  if (isDevelopment()) {
    return getDevelopmentSiteUrl()
  }

  const candidates = [
    process.env.SITE_URL?.trim(),
    process.env.NEXT_PUBLIC_SITE_URL?.trim(),
    process.env.NEXTAUTH_URL?.trim(),
  ].filter((v): v is string => Boolean(v))

  for (const raw of candidates) {
    const origin = canonicalizeOrigin(raw)
    if (isProduction() && LOCALHOST_RE.test(origin)) continue
    return origin
  }

  if (isProduction()) {
    return DEFAULT_PRODUCTION_ORIGINS[0]
  }

  return undefined
}

/** En producción fija NEXTAUTH_URL al arrancar; en dev se actualiza por request. */
export function bootstrapNextAuthUrl(): string | undefined {
  if (isDevelopment()) {
    return process.env.NEXTAUTH_URL
  }

  const configured = getConfiguredSiteUrl()
  if (configured) {
    process.env.NEXTAUTH_URL = configured
    return configured
  }

  const current = process.env.NEXTAUTH_URL ?? ''
  if (!current || LOCALHOST_RE.test(current)) {
    console.error(
      '[auth] Producción sin SITE_URL/NEXTAUTH_URL público. ' +
        'Define SITE_URL=https://arandanocafe.com en .env.local y reinicia PM2.'
    )
  }

  return process.env.NEXTAUTH_URL
}

export function getGoogleOAuthRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL ?? getConfiguredSiteUrl() ?? devDefaultOrigin()
  return `${normalizeOrigin(base)}/api/auth/callback/google`
}

export function shouldTrustRequestHost(): boolean {
  if (process.env.AUTH_TRUST_HOST === 'true') return true
  if (process.env.AUTH_TRUST_HOST === 'false') return false
  return isProduction() || isDevelopment()
}

export function originFromHeaders(headers: Headers): string | undefined {
  const forwardedHost = headers.get('x-forwarded-host')
  const host =
    forwardedHost?.split(',')[0]?.trim() || headers.get('host')?.split(',')[0]?.trim()
  if (!host) return undefined

  const forwardedProto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  let proto = forwardedProto || (LOCALHOST_RE.test(host) ? 'http' : 'https')

  if (isProduction() && !LOCALHOST_RE.test(host) && proto === 'http') {
    proto = 'https'
  }

  return normalizeOrigin(`${proto}://${host}`)
}

export function resolvePublicOrigin(headers?: Headers): string {
  if (headers) {
    const fromRequest = originFromHeaders(headers)
    if (fromRequest) {
      if (isDevelopment() && isLocalhostOrigin(fromRequest)) {
        return fromRequest
      }
      if (shouldTrustRequestHost() && isAllowedOAuthOrigin(fromRequest)) {
        return fromRequest
      }
    }
  }

  const configured = getConfiguredSiteUrl()
  if (configured) return configured

  return devDefaultOrigin()
}

export function ensureNextAuthUrlForOAuth(reqHeaders?: Headers): string {
  const origin = reqHeaders ? resolvePublicOrigin(reqHeaders) : getConfiguredSiteUrl() ?? devDefaultOrigin()
  const url = canonicalizeOrigin(origin)
  process.env.NEXTAUTH_URL = url
  return url
}

export function applyNextAuthUrl(origin: string): string {
  const normalized = canonicalizeOrigin(origin)

  if (isAllowedOAuthOrigin(normalized)) {
    process.env.NEXTAUTH_URL = normalized
    return normalized
  }

  const configured = getConfiguredSiteUrl()
  if (configured) {
    const canonical = canonicalizeOrigin(configured)
    process.env.NEXTAUTH_URL = canonical
    return canonical
  }

  process.env.NEXTAUTH_URL = normalized
  return normalized
}

export function applyNextAuthUrlFromRequest(req: NextRequest): string {
  return applyNextAuthUrl(resolvePublicOrigin(req.headers))
}

export function applyNextAuthUrlFromHeaders(headers: Headers): string {
  return applyNextAuthUrl(resolvePublicOrigin(headers))
}

export function usesSecureCookies(): boolean {
  if (isDevelopment()) {
    return (process.env.NEXTAUTH_URL ?? '').startsWith('https://')
  }
  const configured = getConfiguredSiteUrl() ?? ''
  if (configured.startsWith('https://')) return true
  if (shouldTrustRequestHost()) return true
  return !LOCALHOST_RE.test(configured)
}

export function getGoogleConsoleRedirectUris(): string[] {
  const uris = new Set<string>([
    'https://arandanocafe.com/api/auth/callback/google',
    'https://www.arandanocafe.com/api/auth/callback/google',
    'http://localhost:3000/api/auth/callback/google',
    'http://localhost:3001/api/auth/callback/google',
  ])
  uris.add(`${getGoogleOAuthRedirectUri()}`)
  if (process.env.NEXTAUTH_URL) {
    uris.add(`${normalizeOrigin(process.env.NEXTAUTH_URL)}/api/auth/callback/google`)
  }
  return [...uris]
}
