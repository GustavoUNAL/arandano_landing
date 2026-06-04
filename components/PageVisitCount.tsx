'use client'

import { useEffect, useState } from 'react'
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

function shouldShowCounter(pathname: string): boolean {
  return !HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function visitLabel(count: number): string {
  return count === 1 ? '1 visita' : `${count.toLocaleString('es-CO')} visitas`
}

/**
 * Muestra cuántas visitas lleva la página actual (esquina inferior, discreto).
 */
export default function PageVisitCount() {
  const pathname = usePathname()
  const [pageVisits, setPageVisits] = useState<number | null>(null)

  useEffect(() => {
    if (!pathname || !shouldShowCounter(pathname)) {
      setPageVisits(null)
      return
    }

    let cancelled = false
    const sessionKey = `arandano-visit-${pathname}`

    const apply = (count: number) => {
      if (!cancelled) setPageVisits(count)
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
              apply(data.pageVisits)
              sessionStorage.setItem(sessionKey, '1')
              return
            }
          }
        }

        const res = await fetch(`/api/visits?path=${encodeURIComponent(pathname)}`)
        if (res.ok) {
          const data = await res.json()
          if (typeof data.pageVisits === 'number') apply(data.pageVisits)
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

  if (pageVisits === null || !pathname || !shouldShowCounter(pathname)) {
    return null
  }

  return (
    <div
      className="fixed bottom-[4.75rem] left-3 right-auto sm:bottom-3 sm:left-auto sm:right-3 z-40 pointer-events-none select-none max-w-[calc(100vw-5.5rem)]"
      aria-live="polite"
      aria-label={visitLabel(pageVisits)}
    >
      <p className="text-[10px] sm:text-xs font-medium text-stone-500 bg-white/95 backdrop-blur-sm border border-stone-200/90 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-sm truncate">
        {visitLabel(pageVisits)}
      </p>
    </div>
  )
}
