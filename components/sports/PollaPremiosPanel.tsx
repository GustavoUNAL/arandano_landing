'use client'

import { IconPremium, IconTrophy } from '@/components/sports/SportsIcons'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import {
  GROUP_STAGE_NO_PASSPORT_NOTE,
  GROUP_STAGE_PRIZES,
  GROUP_STAGE_WINNERS_COUNT,
  KNOCKOUT_PASSPORT_ACQUIRE_NOTE,
  KNOCKOUT_PASSPORT_PRICE_LABEL,
  KNOCKOUT_PASSPORT_RULES,
  KNOCKOUT_PHASE_LABEL,
  KNOCKOUT_PRIZES_NOTE,
  PRIZE_CLAIM_RULES,
} from '@/lib/polla-rules'

const MEDALS = ['🥇', '🥈', '🥉', '4°']

interface PollaPremiosPanelProps {
  isDark?: boolean
  compact?: boolean
  className?: string
}

export default function PollaPremiosPanel({
  isDark = true,
  compact = false,
  className = '',
}: PollaPremiosPanelProps) {
  const theme = mundialTheme(isDark)
  const knockoutDetailRules = KNOCKOUT_PASSPORT_RULES.filter(
    (rule) => rule !== KNOCKOUT_PASSPORT_ACQUIRE_NOTE
  )

  return (
    <div
      className={`rounded-2xl border text-left ${theme.cardSoft} ${
        compact ? 'p-4' : 'p-5 sm:p-6'
      } ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <IconTrophy className={`shrink-0 ${theme.accentLink} ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>
          Premios de la polla
        </h3>
      </div>

      <p className={`text-[11px] sm:text-xs mb-4 ${theme.muted}`}>
        Dos premiaciones independientes. Grupos: top {GROUP_STAGE_WINNERS_COUNT} sin pasaporte. Polla final
        desde cuartos ({KNOCKOUT_PASSPORT_PRICE_LABEL}) — octavos solo entrenamiento.
      </p>

      <div className="space-y-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${theme.accent}`}>
            Primera polla · Fase de grupos · {GROUP_STAGE_WINNERS_COUNT} ganadores
          </p>
          <p className={`text-[11px] sm:text-xs mb-3 leading-relaxed font-medium ${theme.muted}`}>
            {GROUP_STAGE_NO_PASSPORT_NOTE}
          </p>
          <ul className="space-y-2">
            {GROUP_STAGE_PRIZES.map((item, i) => (
              <li
                key={item.place}
                className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${
                  isDark
                    ? 'border-amber-500/20 bg-amber-950/20'
                    : 'border-amber-200 bg-amber-50/80'
                }`}
              >
                <span className="text-base shrink-0 leading-none mt-0.5">{MEDALS[i]}</span>
                <div className="min-w-0">
                  <p className={`text-[10px] uppercase tracking-wide font-semibold ${theme.mutedSm}`}>
                    {item.place}
                  </p>
                  <p
                    className={`text-xs sm:text-sm font-medium leading-snug ${
                      isDark ? 'text-stone-100' : 'text-stone-800'
                    }`}
                  >
                    {item.prize}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`rounded-xl border px-3 py-3.5 ${
            isDark
              ? 'border-berry-500/25 bg-berry-950/25'
              : 'border-berry-200 bg-berry-50/80'
          }`}
        >
          <div className="flex items-start gap-2">
            <IconPremium
              className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
            />
            <div>
              <p className={`text-xs font-semibold ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
                Polla final · {KNOCKOUT_PHASE_LABEL}
              </p>
              <p
                className={`text-[11px] sm:text-xs mt-1.5 leading-relaxed font-semibold ${
                  isDark ? 'text-stone-100' : 'text-stone-800'
                }`}
              >
                {KNOCKOUT_PASSPORT_ACQUIRE_NOTE}
              </p>
              <ul className={`mt-3 space-y-2 text-[11px] sm:text-xs leading-relaxed ${theme.muted}`}>
                {knockoutDetailRules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <span className="text-berry-400 shrink-0">·</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
              <p className={`text-[11px] sm:text-xs mt-3 italic ${theme.mutedSm}`}>
                {KNOCKOUT_PRIZES_NOTE}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`rounded-xl border px-3 py-3.5 ${
            isDark ? 'border-stone-600/30 bg-stone-900/30' : 'border-stone-200 bg-stone-50/80'
          }`}
        >
          <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Cobro de premios
          </p>
          <ul className={`space-y-2 text-[11px] sm:text-xs leading-relaxed ${theme.muted}`}>
            {PRIZE_CLAIM_RULES.map((rule) => (
              <li key={rule} className="flex gap-2">
                <span className="text-berry-400 shrink-0">·</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
