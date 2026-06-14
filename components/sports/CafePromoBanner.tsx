'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'polla-cafe-promo-dismissed'

interface CafePromoBannerProps {
  isDark?: boolean
  compact?: boolean
  className?: string
}

export default function CafePromoBanner({ isDark = true, compact = false, className = '' }: CafePromoBannerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(localStorage.getItem(STORAGE_KEY) !== '1')
  }, [])

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${
        isDark
          ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/50 via-stone-900 to-berry-950/40'
          : 'border-amber-200 bg-gradient-to-r from-amber-50 via-white to-berry-50'
      } ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden>
          ☕
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
            Arándano Café Bar
          </p>
          <p className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-stone-900'}`}>
            {compact ? 'Visítanos en Pasto' : 'Ven al café y vive el Mundial en grande'}
          </p>
          <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Zona universitaria · abierto 24/7. Café, snacks y la mejor compañía para ver los partidos.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Link
              href="/"
              className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                isDark
                  ? 'bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 border border-amber-500/30'
                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
              }`}
            >
              Conocer el café →
            </Link>
            <Link
              href="/contacto"
              className={`inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full border ${
                isDark ? 'border-white/15 text-stone-300 hover:bg-white/5' : 'border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
            >
              Ubicación
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className={`shrink-0 text-lg leading-none px-1 ${isDark ? 'text-stone-500 hover:text-white' : 'text-stone-400 hover:text-stone-700'}`}
          aria-label="Cerrar publicidad"
        >
          ×
        </button>
      </div>
    </div>
  )
}
