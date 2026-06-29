'use client'

import TeamCrest from '@/components/sports/TeamCrest'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import type { MundialHighlight } from '@/lib/mundial-highlights'

const ACCENT: Record<NonNullable<MundialHighlight['accent']>, { ring: string; bg: string; text: string }> = {
  gold: {
    ring: 'border-amber-500/40',
    bg: 'from-amber-500/15 to-transparent',
    text: 'text-amber-400',
  },
  green: {
    ring: 'border-emerald-500/40',
    bg: 'from-emerald-500/15 to-transparent',
    text: 'text-emerald-400',
  },
  berry: {
    ring: 'border-berry-500/40',
    bg: 'from-berry-500/15 to-transparent',
    text: 'text-berry-400',
  },
  sky: {
    ring: 'border-sky-500/40',
    bg: 'from-sky-500/15 to-transparent',
    text: 'text-sky-400',
  },
  amber: {
    ring: 'border-orange-500/40',
    bg: 'from-orange-500/15 to-transparent',
    text: 'text-orange-400',
  },
}

interface MundialHighlightsProps {
  highlights: MundialHighlight[]
  isDark?: boolean
  playerCount?: number
  playedMatches?: number
  className?: string
}

export default function MundialHighlights({
  highlights,
  isDark = true,
  playerCount = 0,
  playedMatches = 0,
  className = '',
}: MundialHighlightsProps) {
  const theme = mundialTheme(isDark)

  if (highlights.length === 0 && playerCount === 0) return null

  return (
    <section className={className}>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${theme.accent}`}>
            Indicadores en vivo
          </p>
          <h3 className="font-display font-bold text-lg sm:text-xl">Torneo + polla</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          {playerCount > 0 && (
            <span className={`px-2.5 py-1 rounded-full border ${isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-white'}`}>
              {playerCount} jugadores
            </span>
          )}
          {playedMatches > 0 && (
            <span className={`px-2.5 py-1 rounded-full border ${isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-white'}`}>
              {playedMatches} partidos jugados
            </span>
          )}
        </div>
      </div>

      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:pb-0">
          {highlights.map((item) => {
            const accent = ACCENT[item.accent ?? 'berry']
            return (
              <article
                key={item.id}
                className={`min-w-[9.5rem] sm:min-w-0 snap-start shrink-0 sm:shrink rounded-2xl border p-3.5 bg-gradient-to-br ${accent.bg} ${
                  isDark ? `${accent.ring} bg-stone-900/80` : 'border-stone-200 bg-white shadow-sm'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xl leading-none shrink-0">{item.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[9px] uppercase tracking-wide font-semibold ${theme.mutedSm}`}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.crest && <TeamCrest src={item.crest} alt="" size={18} />}
                      <p className={`font-bold text-sm truncate ${accent.text}`}>{item.value}</p>
                    </div>
                    {item.subtitle && (
                      <p className={`text-[10px] mt-1 leading-snug line-clamp-2 ${theme.mutedSm}`}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
