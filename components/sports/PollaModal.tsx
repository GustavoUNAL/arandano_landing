'use client'

import { mundialTheme } from '@/lib/mundial-theme-classes'
import { useEffect, type ReactNode } from 'react'

const ACCENT_STYLES = {
  berry: {
    header: 'from-berry-600/30 via-berry-900/20 to-transparent',
    ring: 'border-berry-500/25',
    glow: 'shadow-berry-900/40',
  },
  emerald: {
    header: 'from-emerald-600/30 via-emerald-900/20 to-transparent',
    ring: 'border-emerald-500/25',
    glow: 'shadow-emerald-900/40',
  },
  gold: {
    header: 'from-amber-500/30 via-amber-900/20 to-transparent',
    ring: 'border-amber-500/25',
    glow: 'shadow-amber-900/40',
  },
} as const

export type PollaModalAccent = keyof typeof ACCENT_STYLES

interface PollaModalProps {
  open: boolean
  onClose: () => void
  isDark?: boolean
  title?: string
  subtitle?: string
  icon?: ReactNode
  accent?: PollaModalAccent
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  footer?: ReactNode
  allowBackdropClose?: boolean
  zIndex?: number
}

export default function PollaModal({
  open,
  onClose,
  isDark = true,
  title,
  subtitle,
  icon,
  accent = 'berry',
  size = 'md',
  children,
  footer,
  allowBackdropClose = true,
  zIndex = 105,
}: PollaModalProps) {
  const theme = mundialTheme(isDark)
  const accentStyle = ACCENT_STYLES[accent]

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && allowBackdropClose) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, allowBackdropClose])

  if (!open) return null

  const maxWidth =
    size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-3 sm:p-4"
      style={{ zIndex }}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        aria-label="Cerrar"
        onClick={allowBackdropClose ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'polla-modal-title' : undefined}
        className={`relative w-full ${maxWidth} max-h-[92vh] flex flex-col rounded-3xl border overflow-hidden shadow-2xl animate-modal-enter ${accentStyle.ring} ${accentStyle.glow} ${
          isDark ? 'bg-stone-950/95 border-white/10' : 'bg-white border-stone-200'
        }`}
      >
        <div className={`relative shrink-0 px-5 pt-5 pb-4 bg-gradient-to-br ${accentStyle.header}`}>
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-stone-300'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {(icon || title) && (
            <div className="pr-10">
              {icon && <div className="mb-2">{icon}</div>}
              {title && (
                <h2 id="polla-modal-title" className="font-display font-bold text-lg sm:text-xl leading-tight">
                  {title}
                </h2>
              )}
              {subtitle && <p className={`text-xs mt-1.5 leading-relaxed ${theme.mutedSm}`}>{subtitle}</p>}
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 min-h-0">{children}</div>

        {footer && (
          <div
            className={`shrink-0 px-5 py-4 border-t ${
              isDark ? 'border-white/10 bg-black/20' : 'border-stone-100 bg-stone-50/80'
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
