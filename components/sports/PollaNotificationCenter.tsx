'use client'

import {
  buildPollaNotifications,
  dismissNotification,
  filterActiveNotifications,
  loadDismissedNotificationIds,
  type PollaNotification,
} from '@/lib/polla-notifications'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { perfilPathForPlayMatch } from '@/lib/perfil-routes'
import type { MatchPrediction } from '@/lib/sports-polla-shared'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface MatchRow {
  id: number
  utcDate: string
  homeTeam: { shortName: string; name: string; tla: string }
  awayTeam: { shortName: string; name: string; tla: string }
  isFinished: boolean
  canPredict: boolean
  prediction: MatchPrediction | null
  startsIn: string
  formattedDate: string
}

interface PollaNotificationCenterProps {
  matches: MatchRow[]
  predictions: MatchPrediction[]
  isDark?: boolean
  onPlayMatch?: (matchId: number) => void
  className?: string
}

function kindDot(kind: PollaNotification['kind']) {
  switch (kind) {
    case 'upcoming':
      return 'bg-sky-400'
    case 'settled':
      return 'bg-emerald-400'
    case 'missed':
      return 'bg-amber-400'
    default:
      return 'bg-stone-400'
  }
}

export default function PollaNotificationCenter({
  matches,
  predictions,
  isDark = true,
  onPlayMatch,
  className = '',
}: PollaNotificationCenterProps) {
  const theme = mundialTheme(isDark)
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    setDismissed(loadDismissedNotificationIds())
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    } else {
      setPermission('unsupported')
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const active = useMemo(() => {
    const all = buildPollaNotifications({ matches, predictions })
    return filterActiveNotifications(all, dismissed)
  }, [matches, predictions, dismissed])

  const handleDismiss = useCallback((id: string) => {
    dismissNotification(id)
    setDismissed((prev) => new Set([...prev, id]))
  }, [])

  const handleAction = useCallback(
    (n: PollaNotification) => {
      handleDismiss(n.id)
      setOpen(false)
      if (n.matchId && (n.kind === 'upcoming' || n.kind === 'missed')) {
        if (onPlayMatch) onPlayMatch(n.matchId)
        else router.push(perfilPathForPlayMatch(n.matchId))
      } else if (n.kind === 'settled') {
        router.push('/perfil?tab=picks')
      }
    },
    [handleDismiss, onPlayMatch, router]
  )

  useEffect(() => {
    if (permission !== 'granted' || active.length === 0) return
    const latest = active[0]
    if (notifiedRef.current.has(latest.id)) return
    notifiedRef.current.add(latest.id)
    try {
      new Notification(latest.title, {
        body: latest.message,
        tag: latest.id,
        icon: '/apple-touch-icon.png',
      })
    } catch {
      /* ignore */
    }
  }, [active, permission])

  const requestBrowserNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported' as const
    const next = await Notification.requestPermission()
    setPermission(next)
    return next
  }, [])

  const toggleOpen = useCallback(() => {
    setOpen((wasOpen) => {
      const willOpen = !wasOpen
      if (willOpen && permission === 'default' && typeof window !== 'undefined' && 'Notification' in window) {
        void requestBrowserNotifications()
      }
      return willOpen
    })
  }, [permission, requestBrowserNotifications])

  const count = active.length
  const pushSupported = permission !== 'unsupported'

  return (
    <div ref={panelRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`relative flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${
          isDark
            ? 'border-white/10 text-stone-400 hover:text-stone-200 hover:bg-white/5'
            : 'border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-100'
        } ${open ? (isDark ? 'bg-white/10 text-stone-200' : 'bg-stone-100 text-stone-800') : ''}`}
        aria-label={count ? `${count} notificaciones` : 'Notificaciones'}
        aria-expanded={open}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[0.95rem] h-[0.95rem] px-0.5 rounded-full bg-berry-600/90 text-[8px] font-bold text-white flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border shadow-xl z-50 overflow-hidden ${
            isDark
              ? 'border-white/10 bg-stone-950/95 backdrop-blur-xl'
              : 'border-stone-200 bg-white/95 backdrop-blur-xl shadow-stone-200/50'
          }`}
        >
          <div className={`px-3 py-2 border-b flex items-center justify-between ${theme.border}`}>
            <p className={`text-[11px] font-medium ${theme.mutedSm}`}>Alertas</p>
            {permission === 'granted' && (
              <span className="text-[10px] text-emerald-400/90 font-medium">Push activo</span>
            )}
          </div>

          {pushSupported && permission !== 'granted' && (
            <div
              className={`px-3 py-2.5 border-b ${
                isDark ? 'border-white/5 bg-berry-950/30' : 'border-berry-100 bg-berry-50/80'
              }`}
            >
              {permission === 'default' ? (
                <>
                  <p className={`text-[11px] font-medium leading-snug ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                    Activa alertas del navegador
                  </p>
                  <p className={`text-[10px] mt-1 leading-relaxed ${theme.mutedSm}`}>
                    Te avisamos de partidos próximos, puntos y picks pendientes aunque no estés en la app.
                  </p>
                  <button
                    type="button"
                    onClick={() => void requestBrowserNotifications()}
                    className="mt-2 w-full py-1.5 rounded-lg bg-berry-600 hover:bg-berry-500 text-white text-[11px] font-semibold transition-colors"
                  >
                    Activar notificaciones
                  </button>
                </>
              ) : (
                <>
                  <p className={`text-[11px] font-medium leading-snug ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                    Notificaciones bloqueadas
                  </p>
                  <p className={`text-[10px] mt-1 leading-relaxed ${theme.mutedSm}`}>
                    Actívalas en los ajustes del navegador para recibir alertas de la polla.
                  </p>
                </>
              )}
            </div>
          )}

          {count === 0 ? (
            <p className={`px-3 py-4 text-center text-[11px] ${theme.mutedSm}`}>Sin alertas pendientes</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {active.slice(0, 10).map((n) => (
                <li
                  key={n.id}
                  className={`px-3 py-2.5 border-b last:border-0 ${
                    isDark ? 'border-white/5 hover:bg-white/[0.03]' : 'border-stone-100 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex gap-2">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${kindDot(n.kind)}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-medium leading-snug ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                        {n.title.replace(/^[^\s]+\s/, '')}
                      </p>
                      <p className={`text-[10px] mt-0.5 leading-relaxed line-clamp-2 ${theme.mutedSm}`}>
                        {n.message}
                      </p>
                      <div className="flex gap-2 mt-1.5">
                        {(n.kind === 'upcoming' || n.kind === 'missed') && n.matchId && (
                          <button
                            type="button"
                            onClick={() => handleAction(n)}
                            className="text-[10px] font-medium text-berry-400 hover:text-berry-300"
                          >
                            Jugar
                          </button>
                        )}
                        {n.kind === 'settled' && (
                          <Link
                            href="/perfil?tab=picks"
                            onClick={() => {
                              handleDismiss(n.id)
                              setOpen(false)
                            }}
                            className="text-[10px] font-medium text-berry-400 hover:text-berry-300"
                          >
                            Ver picks
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDismiss(n.id)}
                          className={`text-[10px] ${theme.mutedSm} hover:opacity-80`}
                        >
                          Ok
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
