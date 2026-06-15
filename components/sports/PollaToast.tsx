'use client'

import { mundialTheme } from '@/lib/mundial-theme-classes'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface PollaToastProps {
  message: string
  isDark?: boolean
  durationMs?: number
  onClose: () => void
}

export default function PollaToast({
  message,
  isDark = true,
  durationMs = 3200,
  onClose,
}: PollaToastProps) {
  const theme = mundialTheme(isDark)
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const enter = requestAnimationFrame(() => setVisible(true))
    const timer = window.setTimeout(() => {
      setVisible(false)
      window.setTimeout(onClose, 280)
    }, durationMs)
    return () => {
      cancelAnimationFrame(enter)
      window.clearTimeout(timer)
    }
  }, [durationMs, onClose])

  if (!mounted) return null

  return createPortal(
    <div
      className={`fixed z-[120] left-1/2 -translate-x-1/2 w-[min(22rem,calc(100vw-2rem))] lg:top-6 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] lg:bottom-auto transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 lg:-translate-y-2'
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl ${
          isDark
            ? 'bg-stone-900/95 border-emerald-500/30 text-stone-100'
            : 'bg-white border-emerald-200 text-stone-900'
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
          }`}
          aria-hidden
        >
          ✓
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">¡Listo!</p>
          <p className={`text-xs mt-0.5 leading-relaxed ${theme.mutedSm}`}>{message}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setVisible(false)
            window.setTimeout(onClose, 280)
          }}
          className={`shrink-0 text-xs font-medium ${theme.mutedSm} hover:opacity-80`}
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  )
}
