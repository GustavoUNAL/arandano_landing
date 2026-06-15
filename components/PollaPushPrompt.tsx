'use client'

import {
  dismissPushPromptForSession,
  getPushPermission,
  subscribeToPollaPush,
  shouldOfferPushPrompt,
  type PushPermission,
  wasPushPromptDismissedThisSession,
} from '@/lib/push-notifications'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function PollaPushPrompt() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [permission, setPermission] = useState<PushPermission>('default')
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    const current = getPushPermission()
    setPermission(current)

    if (current !== 'default') return
    if (!shouldOfferPushPrompt(pathname)) return
    if (wasPushPromptDismissedThisSession()) return

    const timer = window.setTimeout(() => setVisible(true), 350)
    return () => window.clearTimeout(timer)
  }, [pathname])

  const activate = useCallback(async () => {
    setRequesting(true)
    try {
      const next = await subscribeToPollaPush()
      setPermission(getPushPermission())
      if (next === 'granted') {
        setVisible(false)
        dismissPushPromptForSession()
      }
    } finally {
      setRequesting(false)
    }
  }, [])

  const dismiss = useCallback(() => {
    dismissPushPromptForSession()
    setVisible(false)
  }, [])

  if (!visible || permission !== 'default') return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="polla-push-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={dismiss}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-berry-200 bg-white shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-berry-600 to-berry-700 px-4 py-3 text-white">
          <p id="polla-push-title" className="font-display font-bold text-base sm:text-lg">
            Activa las alertas del Mundial
          </p>
          <p className="text-xs sm:text-sm text-berry-100 mt-1 leading-relaxed">
            Te avisamos en el celular cuando se acerque un partido, sumes puntos o tengas picks pendientes.
          </p>
        </div>

        <div className="px-4 py-4 space-y-3">
          <ul className="text-xs text-stone-600 space-y-1.5">
            <li>⏰ Recordatorio antes del pitazo</li>
            <li>🎉 Puntos cuando se liquida tu pick</li>
            <li>⚽ Partidos que aún no has pronosticado</li>
          </ul>

          <button
            type="button"
            onClick={() => void activate()}
            disabled={requesting}
            className="w-full min-h-[48px] rounded-xl bg-berry-600 hover:bg-berry-500 active:bg-berry-700 text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {requesting ? 'Esperando permiso…' : 'Permitir notificaciones'}
          </button>

          <button
            type="button"
            onClick={dismiss}
            className="w-full py-2 text-xs font-medium text-stone-500 hover:text-stone-700"
          >
            Ahora no
          </button>

          <p className="text-[10px] text-stone-400 text-center leading-relaxed">
            El navegador te pedirá confirmación. Puedes cambiarlo después en ajustes del celular.
          </p>
        </div>
      </div>
    </div>
  )
}
