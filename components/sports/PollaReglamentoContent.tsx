'use client'

import {
  GROUP_STAGE_PRIZES,
  GROUP_STAGE_WINNERS_COUNT,
  KNOCKOUT_OCTAVOS_START_LABEL,
  KNOCKOUT_PASSPORT_PRICE_LABEL,
  KNOCKOUT_PHASE_LABEL,
  KNOCKOUT_TRAINING_NOTE,
  REGLAMENTO_SECTIONS,
  TOP_WINNERS_COUNT,
  formatCop,
  getKnockoutPrizeBreakdown,
  type KnockoutPrizeShare,
} from '@/lib/polla-rules'
import { mundialTheme } from '@/lib/mundial-theme-classes'

interface PollaReglamentoContentProps {
  isDark?: boolean
  passportHolders?: number
  knockoutPrizeBreakdown?: KnockoutPrizeShare[]
}

export default function PollaReglamentoContent({
  isDark = true,
  passportHolders = 0,
  knockoutPrizeBreakdown,
}: PollaReglamentoContentProps) {
  const theme = mundialTheme(isDark)
  const breakdown = knockoutPrizeBreakdown ?? getKnockoutPrizeBreakdown(passportHolders)

  return (
    <div className="space-y-5 text-sm">
      <div className={`rounded-xl border px-4 py-3 ${isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
        <p className={`font-semibold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
          Novedad desde el {KNOCKOUT_OCTAVOS_START_LABEL}
        </p>
        <p className={`text-xs mt-1 leading-relaxed ${theme.muted}`}>{KNOCKOUT_TRAINING_NOTE}</p>
        <p className={`text-xs mt-2 leading-relaxed ${theme.muted}`}>
          La polla final premiada arranca en cuartos. Pasaporte: {KNOCKOUT_PASSPORT_PRICE_LABEL}.
        </p>
      </div>

      <div>
        <p className="font-semibold mb-2">Premios fase de grupos (top {GROUP_STAGE_WINNERS_COUNT})</p>
        <ul className={`space-y-1 text-xs ${theme.muted}`}>
          {GROUP_STAGE_PRIZES.map((p) => (
            <li key={p.place}>
              <span className="font-medium">{p.place}:</span> {p.prize}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-semibold mb-2">
          Polla final — {TOP_WINNERS_COUNT} ganadores proporcionales
        </p>
        <p className={`text-xs mb-2 ${theme.muted}`}>
          {KNOCKOUT_PHASE_LABEL}. Entre más pasaportes se vendan, más grande es el pozo (
          {passportHolders} activos ahora).
        </p>
        <ul className={`space-y-1 text-xs ${theme.muted}`}>
          {breakdown.map((row) => (
            <li key={row.place}>
              <span className="font-medium">{row.place}</span> — {row.percent}% ·{' '}
              {formatCop(row.amountCop)}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        {REGLAMENTO_SECTIONS.map((section) => (
          <div key={section.id}>
            <p className="font-semibold text-xs mb-1.5">{section.title}</p>
            <ul className={`space-y-1 text-[11px] leading-relaxed list-disc pl-4 ${theme.muted}`}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
