'use client'

import { IconInfo } from '@/components/sports/SportsIcons'
import { REGLAMENTO_SHORT } from '@/lib/polla-rules'
import Link from 'next/link'
import { useState } from 'react'

import { mundialTheme } from '@/lib/mundial-theme-classes'

interface PollaReglamentoProps {
  compact?: boolean
  isDark?: boolean
}

export default function PollaReglamento({ compact = false, isDark = true }: PollaReglamentoProps) {
  const theme = mundialTheme(isDark)
  const [open, setOpen] = useState(!compact)

  return (
    <section className={`rounded-2xl border overflow-hidden ${theme.cardSoft}`}>
      <div className={`px-4 py-3 flex items-center gap-2 border-b ${theme.border}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-2 text-left hover:opacity-90 transition-opacity"
        >
          <IconInfo className="w-4 h-4 text-berry-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm">Resumen del reglamento</h3>
            {compact && <p className={`text-[10px] truncate mt-0.5 ${theme.mutedSm}`}>{REGLAMENTO_SHORT}</p>}
          </div>
          <span className={`text-xs shrink-0 ${theme.mutedSm}`}>{open ? '▲' : '▼'}</span>
        </button>
      </div>

      {open && (
        <div className="px-4 py-4">
          <p className={`text-xs leading-relaxed mb-4 ${theme.muted}`}>{REGLAMENTO_SHORT}</p>
          <Link
            href="/mundial/reglamento"
            className="flex items-center justify-center w-full py-2.5 rounded-xl bg-berry-600/20 border border-berry-500/30 text-berry-300 text-sm font-semibold hover:bg-berry-600/30 transition-colors"
          >
            Reglamento y condiciones completas →
          </Link>
        </div>
      )}
    </section>
  )
}
