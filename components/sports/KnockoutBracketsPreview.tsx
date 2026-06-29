'use client'

import TeamCrest from '@/components/sports/TeamCrest'
import type { KnockoutRound } from '@/lib/football-data'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { KNOCKOUT_TRAINING_STAGES } from '@/lib/polla-rules'

interface KnockoutBracketsPreviewProps {
  rounds: KnockoutRound[]
  isDark?: boolean
  onPlayMatch?: (matchId: number) => void
  className?: string
}

function teamShort(name: string, short?: string, tla?: string) {
  return short || tla || name.split(' ').pop() || name
}

export default function KnockoutBracketsPreview({
  rounds,
  isDark = true,
  onPlayMatch,
  className = '',
}: KnockoutBracketsPreviewProps) {
  const theme = mundialTheme(isDark)
  const previewRounds = rounds.filter((r) =>
    ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL', 'THIRD_PLACE'].includes(r.stage)
  )

  if (previewRounds.length === 0) return null

  return (
    <section className={`rounded-2xl border overflow-hidden ${theme.cardSoft} ${className}`}>
      <div className={`px-4 py-3 border-b ${theme.border}`}>
        <h3 className="font-semibold text-sm">Llaves eliminatorias</h3>
        <p className={`text-[10px] mt-0.5 ${theme.mutedSm}`}>
          Octavos y dieciseisavos: entrenamiento · desde cuartos suma en la polla final
        </p>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-1">
          {previewRounds.map((round, roundIdx) => {
            const isTraining = KNOCKOUT_TRAINING_STAGES.includes(
              round.stage as (typeof KNOCKOUT_TRAINING_STAGES)[number]
            )
            return (
              <div key={round.stage} className="w-[11.5rem] shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isTraining ? 'bg-sky-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  <p className="text-[11px] font-bold uppercase tracking-wide truncate">{round.label}</p>
                </div>
                <div className="space-y-2">
                  {round.matches.slice(0, 4).map((match, matchIdx) => {
                    const finished = match.isFinished
                    const winnerHome =
                      finished &&
                      match.displayScore.home != null &&
                      match.displayScore.away != null &&
                      match.displayScore.home > match.displayScore.away
                    const winnerAway =
                      finished &&
                      match.displayScore.home != null &&
                      match.displayScore.away != null &&
                      match.displayScore.away > match.displayScore.home
                    return (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => onPlayMatch?.(match.id)}
                        className={`w-full rounded-xl border p-2 text-left transition-all hover:scale-[1.02] ${
                          finished
                            ? isDark
                              ? 'border-emerald-500/40 bg-emerald-950/30'
                              : 'border-emerald-300 bg-emerald-50'
                            : isDark
                              ? 'border-white/10 bg-white/[0.03] hover:border-berry-500/30'
                              : 'border-stone-200 bg-white hover:border-berry-300'
                        }`}
                        style={{ animationDelay: `${roundIdx * 80 + matchIdx * 40}ms` }}
                      >
                        <div className="flex items-center gap-1.5">
                          <TeamCrest src={match.homeTeam.crest} alt="" size={18} />
                          <span
                            className={`text-[10px] flex-1 truncate ${
                              winnerHome ? 'font-bold text-emerald-400' : ''
                            }`}
                          >
                            {teamShort(match.homeTeam.name, match.homeTeam.shortName, match.homeTeam.tla)}
                          </span>
                          <span className="text-[10px] font-bold tabular-nums">
                            {match.displayScore.home ?? '–'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <TeamCrest src={match.awayTeam.crest} alt="" size={18} />
                          <span
                            className={`text-[10px] flex-1 truncate ${
                              winnerAway ? 'font-bold text-emerald-400' : ''
                            }`}
                          >
                            {teamShort(match.awayTeam.name, match.awayTeam.shortName, match.awayTeam.tla)}
                          </span>
                          <span className="text-[10px] font-bold tabular-nums">
                            {match.displayScore.away ?? '–'}
                          </span>
                        </div>
                        {finished && (
                          <p className="text-[9px] text-emerald-400 mt-1 animate-pulse font-medium">
                            ✓ Ganador definido
                          </p>
                        )}
                        {!finished && match.isLive && (
                          <p className="text-[9px] text-red-400 mt-1 font-medium">● En vivo</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
