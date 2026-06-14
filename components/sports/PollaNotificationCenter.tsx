'use client'

import {
  buildPollaNotifications,
  dismissNotification,
  filterActiveNotifications,
  loadDismissedNotificationIds,
  type PollaNotification,
} from '@/lib/polla-notifications'
import {
  getPushPermission,
  requestPushPermission,
  type PushPermission,
} from '@/lib/push-notifications'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { perfilPathForPlayMatch } from '@/lib/perfil-routes'
import type { MatchPrediction } from '@/lib/sports-polla-shared'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
  panelAlign?: 'left' | 'right'
  panelPlacement?: 'above' | 'below'
  size?: 'default' | 'comfortable'
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
  panelAlign = 'right',
  panelPlacement = 'below',
  size = 'default',
}: PollaNotificationCenterProps) {
  const theme = mundialTheme(isDark)
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState<PushPermission>('default')
  const [mounted, setMounted] = useState(false)
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
    setDismissed(loadDismissedNotificationIds())
    setPermission(getPushPermission())
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if ((target as HTMLElement).closest?.('[data-polla-notification-content]')) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
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
    const next = await requestPushPermission()
    setPermission(next)
    return next
  }, [])

  const toggleOpen = useCallback(() => {
    setOpen((wasOpen) => {
      const willOpen = !wasOpen
      if (willOpen && permission === 'default') {
        void requestBrowserNotifications()
      }
      return willOpen
    })
  }, [permission, requestBrowserNotifications])

  const count = active.length
  const pushSupported = permission !== 'unsupported'
  const buttonSizeClass =
    size === 'comfortable'
      ? `w-10 h-10 sm:w-9 sm:h-9 ${isDark ? '' : 'shadow-md bg-white/95'}`
      : 'w-8 h-8'
  const panelPositionClass =
    panelPlacement === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
  const panelAlignClass = panelAlign === 'left' ? 'left-0' : 'right-0'

  const panelSurfaceClass = isDark
    ? 'border-white/10 bg-stone-950/98 backdrop-blur-xl'
    : 'border-stone-200 bg-white/98 backdrop-blur-xl shadow-stone-200/50'

  const panelBody = (
    <>
      <div className={`px-3 py-2.5 border-b flex items-center justify-between ${theme.border}`}>
        <p className={`text-xs font-semibold ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>Alertas</p>
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
                className="mt-2 w-full py-2 rounded-lg bg-berry-600 hover:bg-berry-500 text-white text-[11px] font-semibold transition-colors"
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
        <p className={`px-3 py-5 text-center text-xs ${theme.mutedSm}`}>Sin alertas pendientes</p>
      ) : (
        <ul className="max-h-[min(16rem,calc(100dvh-11rem))] overflow-y-auto overscroll-contain">
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
                  <p className={`text-xs font-medium leading-snug ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                    {n.title.replace(/^[^\s]+\s/, '')}
                  </p>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${theme.mutedSm}`}>{n.message}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(n.kind === 'upcoming' || n.kind === 'missed') && n.matchId && (
                      <button
                        type="button"
                        onClick={() => handleAction(n)}
                        className="text-[11px] font-medium text-berry-400 hover:text-berry-300"
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
                        className="text-[11px] font-medium text-berry-400 hover:text-berry-300"
                      >
                        Ver picks
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismiss(n.id)}
                      className={`text-[11px] ${theme.mutedSm} hover:opacity-80`}
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
    </>
  )

  const mobilePortal =
    mounted && open
      ? createPortal(
          <div className="lg:hidden fixed inset-0 z-[100]">
            <button
              type="button"
              className="absolute inset-0 bg-stone-950/40 backdrop-blur-[1px]"
              aria-label="Cerrar alertas"
              onClick={() => setOpen(false)}
            />
            <div
              className={`absolute right-3 top-[max(3.25rem,calc(env(safe-area-inset-top)+2.75rem))] w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border shadow-2xl overflow-hidden ${panelSurfaceClass}`}
              data-polla-notification-content
            >
              {panelBody}
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <div ref={rootRef} className={`relative shrink-0 ${className}`}>
        <button
          type="button"
          onClick={toggleOpen}
          className={`relative flex items-center justify-center rounded-full border transition-colors ${buttonSizeClass} ${
            isDark
              ? 'border-white/10 text-stone-400 hover:text-stone-200 hover:bg-white/5'
              : 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          } ${open ? (isDark ? 'bg-white/10 text-stone-200' : 'bg-stone-100 text-stone-800') : ''}`}
          aria-label={count ? `${count} notificaciones` : 'Notificaciones'}
          aria-expanded={open}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-[1rem] px-0.5 rounded-full bg-berry-600 text-[9px] font-bold text-white flex items-center justify-center leading-none">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>

        {open && (
          <div
            className={`hidden lg:block absolute ${panelAlignClass} ${panelPositionClass} w-[min(20rem,calc(100vw-2rem))] rounded-2xl border shadow-xl z-[60] overflow-hidden ${panelSurfaceClass}`}
            data-polla-notification-content
          >
            {panelBody}
          </div>
        )}
      </div>
      {mobilePortal}
    </>
  )
}
