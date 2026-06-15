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
  subscribeToPollaPush,
  shouldShowForegroundNotification,
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
  loading?: boolean
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

function kindEmoji(kind: PollaNotification['kind']) {
  switch (kind) {
    case 'upcoming':
      return '⏰'
    case 'settled':
      return '🎉'
    case 'missed':
      return '😅'
    default:
      return '•'
  }
}

export default function PollaNotificationCenter({
  matches,
  predictions,
  loading = false,
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
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
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
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches
    if (isDesktop) return
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
    if (!shouldShowForegroundNotification() || active.length === 0) return
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
  }, [active])

  const requestBrowserNotifications = useCallback(async () => {
    const next = await subscribeToPollaPush()
    setPermission(getPushPermission())
    return next
  }, [])

  const refreshAnchor = useCallback(() => {
    if (rootRef.current) {
      setAnchorRect(rootRef.current.getBoundingClientRect())
    }
  }, [])

  const toggleOpen = useCallback(() => {
    setOpen((wasOpen) => {
      const willOpen = !wasOpen
      if (willOpen) {
        refreshAnchor()
        if (permission === 'default') {
          void requestBrowserNotifications()
        }
      }
      return willOpen
    })
  }, [permission, refreshAnchor, requestBrowserNotifications])

  useEffect(() => {
    if (!open) return
    refreshAnchor()
    const onLayout = () => refreshAnchor()
    window.addEventListener('resize', onLayout)
    window.addEventListener('scroll', onLayout, true)
    return () => {
      window.removeEventListener('resize', onLayout)
      window.removeEventListener('scroll', onLayout, true)
    }
  }, [open, refreshAnchor])

  const count = active.length
  const pushSupported = permission !== 'unsupported'
  const buttonSizeClass =
    size === 'comfortable'
      ? `w-10 h-10 sm:w-9 sm:h-9 ${isDark ? '' : 'shadow-md bg-white/95'}`
      : 'w-8 h-8'

  const panelSurfaceClass = isDark
    ? 'border-white/10 bg-stone-950/98 backdrop-blur-xl shadow-black/40'
    : 'border-stone-200 bg-white shadow-xl shadow-stone-300/30'

  const panelBody = (
    <>
      <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${theme.border}`}>
        <div>
          <p className={`text-sm font-semibold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Alertas de la polla
          </p>
          <p className={`text-[11px] mt-0.5 ${theme.mutedSm}`}>
            {loading ? 'Actualizando…' : count ? `${count} pendiente${count === 1 ? '' : 's'}` : 'Al día'}
          </p>
        </div>
        {permission === 'granted' && (
          <span className="text-[10px] text-emerald-400/90 font-medium shrink-0">Push activo</span>
        )}
      </div>

      {pushSupported && permission !== 'granted' && (
        <div
          className={`px-4 py-3 border-b ${
            isDark ? 'border-white/5 bg-berry-950/30' : 'border-berry-100 bg-berry-50/80'
          }`}
        >
          {permission === 'default' ? (
            <>
              <p className={`text-xs font-medium leading-snug ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                Activa alertas del navegador
              </p>
              <p className={`text-[11px] mt-1 leading-relaxed ${theme.mutedSm}`}>
                Partidos próximos, puntos y picks pendientes.
              </p>
              <button
                type="button"
                onClick={() => void requestBrowserNotifications()}
                className="mt-2.5 w-full py-2.5 rounded-xl bg-berry-600 hover:bg-berry-500 text-white text-xs font-semibold transition-colors"
              >
                Activar notificaciones
              </button>
            </>
          ) : (
            <>
              <p className={`text-xs font-medium leading-snug ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                Notificaciones bloqueadas
              </p>
              <p className={`text-[11px] mt-1 leading-relaxed ${theme.mutedSm}`}>
                Actívalas en los ajustes del navegador.
              </p>
            </>
          )}
        </div>
      )}

      {loading && count === 0 ? (
        <div className="px-4 py-8 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-berry-400/30 border-t-berry-400 rounded-full animate-spin" />
          <p className={`text-xs ${theme.mutedSm}`}>Cargando alertas…</p>
        </div>
      ) : count === 0 ? (
        <p className={`px-4 py-8 text-center text-sm ${theme.mutedSm}`}>Sin alertas pendientes</p>
      ) : (
        <ul className="max-h-[min(22rem,calc(100dvh-12rem))] lg:max-h-[28rem] overflow-y-auto overscroll-contain">
          {active.slice(0, 10).map((n) => (
            <li
              key={n.id}
              className={`px-4 py-3 border-b last:border-0 ${
                isDark ? 'border-white/5 hover:bg-white/[0.03]' : 'border-stone-100 hover:bg-stone-50'
              }`}
            >
              <div className="flex gap-3">
                <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden>
                  {kindEmoji(n.kind)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                    {n.title.replace(/^[^\s]+\s/, '')}
                  </p>
                  <p className={`text-xs mt-1 leading-relaxed ${theme.mutedSm}`}>{n.message}</p>
                  <div className="flex flex-wrap gap-3 mt-2.5">
                    {(n.kind === 'upcoming' || n.kind === 'missed') && n.matchId && (
                      <button
                        type="button"
                        onClick={() => handleAction(n)}
                        className="text-xs font-semibold text-berry-400 hover:text-berry-300"
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
                        className="text-xs font-semibold text-berry-400 hover:text-berry-300"
                      >
                        Ver picks
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismiss(n.id)}
                      className={`text-xs ${theme.mutedSm} hover:opacity-80`}
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

  const desktopPanelStyle =
    anchorRect && panelPlacement === 'below'
      ? {
          top: anchorRect.bottom + 8,
          ...(panelAlign === 'right'
            ? { right: Math.max(16, window.innerWidth - anchorRect.right) }
            : { left: Math.max(16, anchorRect.left) }),
        }
      : anchorRect && panelPlacement === 'above'
        ? {
            bottom: window.innerHeight - anchorRect.top + 8,
            ...(panelAlign === 'right'
              ? { right: Math.max(16, window.innerWidth - anchorRect.right) }
              : { left: Math.max(16, anchorRect.left) }),
          }
        : undefined

  const desktopPortal =
    mounted && open && anchorRect
      ? createPortal(
          <div className="hidden lg:block">
            <button
              type="button"
              className="fixed inset-0 z-[90] cursor-default"
              aria-label="Cerrar alertas"
              onClick={() => setOpen(false)}
            />
            <div
              className={`fixed z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-2xl border overflow-hidden ${panelSurfaceClass}`}
              style={desktopPanelStyle}
              data-polla-notification-content
            >
              {panelBody}
            </div>
          </div>,
          document.body
        )
      : null

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
              className={`absolute right-3 top-[max(3.25rem,calc(env(safe-area-inset-top)+2.75rem))] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border shadow-2xl overflow-hidden ${panelSurfaceClass}`}
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
          <svg className="w-4 h-4 lg:w-[18px] lg:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {loading && count === 0 ? (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-berry-500/80 animate-pulse" />
          ) : count > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-0.5 rounded-full bg-berry-600 text-[10px] font-bold text-white flex items-center justify-center leading-none">
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </button>
      </div>
      {desktopPortal}
      {mobilePortal}
    </>
  )
}
