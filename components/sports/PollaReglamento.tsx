'use client'

import { IconInfo } from '@/components/sports/SportsIcons'
import { REGLAMENTO_SHORT } from '@/lib/polla-rules'
import Link from 'next/link'
import { useState } from 'react'

interface PollaReglamentoProps {
  compact?: boolean
}

export default function PollaReglamento({ compact = false }: PollaReglamentoProps) {
  const [open, setOpen] = useState(!compact)

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-2 text-left hover:opacity-90 transition-opacity"
        >
          <IconInfo className="w-4 h-4 text-berry-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm">Resumen del reglamento</h3>
            {compact && <p className="text-[10px] text-stone-500 truncate mt-0.5">{REGLAMENTO_SHORT}</p>}
          </div>
          <span className="text-stone-500 text-xs shrink-0">{open ? '▲' : '▼'}</span>
        </button>
      </div>

      {open && (
        <div className="px-4 py-4">
          <p className="text-xs text-stone-400 leading-relaxed mb-4">{REGLAMENTO_SHORT}</p>
          <Link
            href="/sports/reglamento"
            className="flex items-center justify-center w-full py-2.5 rounded-xl bg-berry-600/20 border border-berry-500/30 text-berry-300 text-sm font-semibold hover:bg-berry-600/30 transition-colors"
          >
            Reglamento y condiciones completas →
          </Link>
        </div>
      )}
    </section>
  )
}
