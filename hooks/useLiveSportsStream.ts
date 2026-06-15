'use client'

import { isLiveWebSocketEnabled } from '@/lib/live-transport-config'
import { useEffect, useRef, useState } from 'react'

interface UseLiveSportsStreamOptions {
  channel: 'home' | 'match' | 'profile'
  matchId?: number
  enabled?: boolean
}

const WS_FALLBACK_MS = 1_500

export function useLiveSportsStream<T>({
  channel,
  matchId,
  enabled = true,
}: UseLiveSportsStreamOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const transportRef = useRef<'ws' | 'sse' | null>(null)
  const hadDataRef = useRef(false)

  useEffect(() => {
    if (data) hadDataRef.current = true
  }, [data])

  useEffect(() => {
    if (!enabled) return
    if (channel === 'match' && !matchId) return

    if (!hadDataRef.current) {
      setLoading(true)
    }
    setError(null)
    setConnected(false)
    transportRef.current = null

    let closed = false
    let es: EventSource | null = null
    let ws: WebSocket | null = null
    let wsFallbackTimer: ReturnType<typeof setTimeout> | null = null

    const params = new URLSearchParams()
    params.set('channel', channel)
    if (channel === 'match' && matchId) {
      params.set('matchId', String(matchId))
    }

    const applyPayload = (payload: T) => {
      if (closed) return
      setData(payload)
      hadDataRef.current = true
      setLoading(false)
      setError(null)
    }

    const clearWsFallback = () => {
      if (wsFallbackTimer) {
        clearTimeout(wsFallbackTimer)
        wsFallbackTimer = null
      }
    }

    const startSse = () => {
      if (closed || transportRef.current === 'sse') return
      transportRef.current = 'sse'
      clearWsFallback()
      es = new EventSource(`/api/sports/live/stream?${params.toString()}`)
      es.onopen = () => {
        if (!closed) setConnected(true)
      }
      es.onmessage = (event) => {
        try {
          applyPayload(JSON.parse(event.data) as T)
        } catch {
          /* ignore */
        }
      }
      es.onerror = () => {
        if (closed) return
        setConnected(false)
        if (!hadDataRef.current) {
          setError('Reconectando transmisión…')
        }
      }
    }

    const fallbackToSseUnlessWsOpen = () => {
      if (closed || transportRef.current === 'ws' || transportRef.current === 'sse') return
      startSse()
    }

    if (!isLiveWebSocketEnabled()) {
      startSse()
      return () => {
        closed = true
        es?.close()
        setConnected(false)
      }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/sports/live?${params.toString()}`
    ws = new WebSocket(wsUrl)

    wsFallbackTimer = setTimeout(fallbackToSseUnlessWsOpen, WS_FALLBACK_MS)

    ws.onopen = () => {
      if (closed) return
      clearWsFallback()
      transportRef.current = 'ws'
      setConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
      try {
        applyPayload(JSON.parse(String(event.data)) as T)
      } catch {
        /* ignore */
      }
    }

    ws.onerror = () => {
      if (closed) return
      ws?.close()
      ws = null
      fallbackToSseUnlessWsOpen()
    }

    ws.onclose = () => {
      if (closed) return
      setConnected(false)
      if (transportRef.current === 'ws') {
        transportRef.current = null
        startSse()
      } else {
        fallbackToSseUnlessWsOpen()
      }
    }

    return () => {
      closed = true
      clearWsFallback()
      ws?.close()
      es?.close()
      setConnected(false)
    }
  }, [channel, matchId, enabled])

  return { data, loading, error, connected, transport: transportRef.current }
}
