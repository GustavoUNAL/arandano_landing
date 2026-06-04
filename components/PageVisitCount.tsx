'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const HIDDEN_PREFIXES = [
  '/admin',
  '/waiter',
  '/sales',
  '/inventory',
  '/analytics',
  '/debts',
  '/informes'
]

function shouldTrack(pathname: string): boolean {
  return !HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Registra visitas en el servidor y las muestra solo en la consola del navegador.
 */
export default function PageVisitCount() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname)) return

    let cancelled = false
    const sessionKey = `arandano-visit-${pathname}`

    const logVisit = (count: number) => {
      if (cancelled) return
      const label = count === 1 ? '1 visita' : `${count.toLocaleString('es-CO')} visitas`
      console.log(`[Arándano] ${pathname} — ${label}`)
    }

    const load = async () => {
      try {
        const already =
          typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionKey)

        if (!already) {
          const res = await fetch('/api/visits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: pathname })
          })
          if (res.ok) {
            const data = await res.json()
            if (typeof data.pageVisits === 'number') {
              logVisit(data.pageVisits)
              sessionStorage.setItem(sessionKey, '1')
              return
            }
          }
        }

        const res = await fetch(`/api/visits?path=${encodeURIComponent(pathname)}`)
        if (res.ok) {
          const data = await res.json()
          if (typeof data.pageVisits === 'number') logVisit(data.pageVisits)
        }
      } catch {
        /* no bloquear la página */
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [pathname])

  return null
}
