'use client'

import TeamCrest from '@/components/sports/TeamCrest'
import type { KnockoutRound } from '@/lib/football-data'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { KNOCKOUT_TRAINING_STAGES } from '@/lib/polla-rules'

interface KnockoutBracketsPreviewProps {
  rounds: KnockoutRound[]
  isDark?: boolean
  hasPassport?: boolean
  onPlayMatch?: (matchId: number) => void
  onBuyPassport?: () => void
  className?: string
}

function teamShort(name: string, short?: string, tla?: string) {
  return short || tla || name.split(' ').pop() || name
}

export default function KnockoutBracketsPreview({
  rounds,
  isDark = true,
  hasPassport,
  onPlayMatch,
  onBuyPassport,
  className = '',
}: KnockoutBracketsPreviewProps) {
  const theme = mundialTheme(isDark)
  const previewRounds = rounds.filter((r) =>
    ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL', 'THIRD_PLACE'].includes(r.stage)
  )

  if (previewRounds.length === 0) return null

  return (
    <section className={`rounded-2xl border overflow-hidden ${theme.cardSoft} ${className}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${theme.border}`}>
        <div>
          <h3 className="font-semibold text-sm">🏆 Llaves eliminatorias</h3>
          <p className={`text-[10px] mt-0.5 ${theme.mutedSm}`}>
            16vos: entrenamiento · desde Cuartos: polla oficial con pasaporte
          </p>
        </div>
        {hasPassport === false && onBuyPassport && (
          <button
            type="button"
            onClick={onBuyPassport}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
              isDark
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-amber-100 border border-amber-300 text-amber-800 hover:bg-amber-200'
            }`}
          >
            🎟️ Comprar pasaporte
          </button>
        )}
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
                  {round.matches.map((match, matchIdx) => {
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
                    const matchDate = match.utcDate
                      ? new Date(match.utcDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
                      : null
                    const matchTime = match.utcDate
                      ? new Date(match.utcDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                      : null
                    return (
                      <button
                        key={match.id}
                        type="button"
                        onClick={() => onPlayMatch?.(match.id)}
                        className={`w-full rounded-xl border p-2 text-left transition-all hover:scale-[1.02] ${
                          match.isLive
                            ? isDark
                              ? 'border-red-500/50 bg-red-950/30'
                              : 'border-red-300 bg-red-50'
                            : finished
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
                          <TeamCrest src={match.homeTeam.crest} alt="" size={16} />
                          <span
                            className={`text-[10px] flex-1 truncate ${
                              winnerHome
                                ? 'font-bold text-emerald-400'
                                : isDark
                                  ? 'text-stone-200'
                                  : 'text-stone-800'
                            }`}
                          >
                            {teamShort(match.homeTeam.name, match.homeTeam.shortName, match.homeTeam.tla)}
                          </span>
                          <span className={`text-[10px] font-bold tabular-nums w-4 text-right ${winnerHome ? 'text-emerald-400' : ''}`}>
                            {match.displayScore.home ?? '–'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <TeamCrest src={match.awayTeam.crest} alt="" size={16} />
                          <span
                            className={`text-[10px] flex-1 truncate ${
                              winnerAway
                                ? 'font-bold text-emerald-400'
                                : isDark
                                  ? 'text-stone-200'
                                  : 'text-stone-800'
                            }`}
                          >
                            {teamShort(match.awayTeam.name, match.awayTeam.shortName, match.awayTeam.tla)}
                          </span>
                          <span className={`text-[10px] font-bold tabular-nums w-4 text-right ${winnerAway ? 'text-emerald-400' : ''}`}>
                            {match.displayScore.away ?? '–'}
                          </span>
                        </div>
                        {match.isLive ? (
                          <p className="text-[9px] text-red-400 mt-1 font-bold animate-pulse">⬤ En vivo</p>
                        ) : finished ? (
                          <p className={`text-[9px] mt-1 font-medium ${isDark ? 'text-emerald-400/70' : 'text-emerald-600'}`}>
                            ✓ Finalizado
                          </p>
                        ) : matchDate ? (
                          <p className={`text-[9px] mt-1 tabular-nums ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                            {matchDate} · {matchTime}
                          </p>
                        ) : null}
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
