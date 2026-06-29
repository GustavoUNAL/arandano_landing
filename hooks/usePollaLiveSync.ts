'use client'

import { useEffect, useRef } from 'react'

interface UsePollaLiveSyncOptions {
  enabled?: boolean
  /** Intervalo si SSE falla o no está disponible */
  fallbackMs?: number
}

/**
 * Sincronización en vivo vía Server-Sent Events (más ligero que WebSocket).
 * Dispara onTick en cada pulso del servidor sin recargar la página.
 */
export function usePollaLiveSync(onTick: () => void, options?: UsePollaLiveSyncOptions) {
  const enabled = options?.enabled ?? true
  const fallbackMs = options?.fallbackMs ?? 30_000
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick

  useEffect(() => {
    if (!enabled) return

    let es: EventSource | null = null
    let fallback: ReturnType<typeof setInterval> | null = null

    const tick = () => onTickRef.current()

    const startFallback = () => {
      if (fallback) return
      fallback = setInterval(tick, fallbackMs)
    }

    const stopFallback = () => {
      if (fallback) {
        clearInterval(fallback)
        fallback = null
      }
    }

    try {
      es = new EventSource('/api/sports/live-stream')
      es.onmessage = () => {
        stopFallback()
        tick()
      }
      es.onerror = () => {
        es?.close()
        es = null
        startFallback()
      }
    } catch {
      startFallback()
    }

    return () => {
      es?.close()
      stopFallback()
    }
  }, [enabled, fallbackMs])
}
