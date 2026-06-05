'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const HIDDEN_PREFIXES = [
  '/admin',
  '/waiter',
  '/sales',
  '/inventory',
  '/analytics',
  '/debts',
  '/informes',
  '/expenses',
  '/tasks',
  '/seo'
]

function shouldTrack(pathname: string): boolean {
  return !HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function getClickLabel(el: HTMLElement): string {
  const aria = el.getAttribute('aria-label')
  if (aria) return aria.slice(0, 200)
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
  if (text) return text.slice(0, 200)
  return el.tagName.toLowerCase()
}

function getClickTarget(el: HTMLElement): string {
  if (el instanceof HTMLAnchorElement && el.href) {
    try {
      const url = new URL(el.href)
      return url.pathname + url.hash
    } catch {
      return el.getAttribute('href') || ''
    }
  }
  return el.getAttribute('data-track') || el.id || ''
}

function postEvent(payload: Record<string, unknown>, useBeacon = false): void {
  const body = JSON.stringify(payload)
  if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/visits', new Blob([body], { type: 'application/json' }))
    return
  }
  fetch('/api/visits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true
  }).catch(() => {})
}

export default function SiteAnalytics() {
  const pathname = usePathname()
  const segmentStartRef = useRef<number>(Date.now())
  const visibleSecondsRef = useRef(0)
  const sentEngagementRef = useRef(false)

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname)) return

    let cancelled = false
    const sessionKey = `arandano-visit-${pathname}`

    const load = async () => {
      try {
        const already =
          typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionKey)

        if (already) return

        sessionStorage.setItem(sessionKey, 'pending')

        const res = await fetch('/api/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pathname })
        })

        if (cancelled) return

        if (res.ok) {
          sessionStorage.setItem(sessionKey, '1')
        } else {
          sessionStorage.removeItem(sessionKey)
        }
      } catch {
        if (!cancelled && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(sessionKey)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [pathname])

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname)) return

    segmentStartRef.current = Date.now()
    visibleSecondsRef.current = 0
    sentEngagementRef.current = false

    const flushVisibleSegment = () => {
      if (document.visibilityState !== 'visible') return
      const elapsed = Math.round((Date.now() - segmentStartRef.current) / 1000)
      if (elapsed > 0) visibleSecondsRef.current += elapsed
      segmentStartRef.current = Date.now()
    }

    const recordEngagement = () => {
      if (sentEngagementRef.current) return
      sentEngagementRef.current = true
      flushVisibleSegment()
      const durationSeconds = visibleSecondsRef.current
      if (durationSeconds >= 3) {
        postEvent({ type: 'engagement', path: pathname, durationSeconds }, true)
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flushVisibleSegment()
      } else {
        segmentStartRef.current = Date.now()
      }
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const el = target.closest('a, button, [role="button"]') as HTMLElement | null
      if (!el) return
      postEvent({
        type: 'click',
        path: pathname,
        label: getClickLabel(el),
        target: getClickTarget(el)
      })
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', recordEngagement)
    document.addEventListener('click', onClick, true)

    return () => {
      recordEngagement()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', recordEngagement)
      document.removeEventListener('click', onClick, true)
    }
  }, [pathname])

  return null
}
