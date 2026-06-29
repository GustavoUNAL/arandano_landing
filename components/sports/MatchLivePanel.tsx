'use client'

import TeamCrest from '@/components/sports/TeamCrest'
import MatchAfStats from '@/components/sports/MatchAfStats'
import { useLiveSportsStream } from '@/hooks/useLiveSportsStream'
import type { MatchDetail } from '@/lib/football-data'
import type { MatchStreamPayload } from '@/lib/live-broadcast-types'
import { getFinishedMatchWinner, winnerBadge } from '@/lib/match-display'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import type { MatchPrediction } from '@/lib/sports-polla-shared'
import type { AfEvent, AfTeamLineup, AfTeamPlayers, AfTeamStats } from '@/lib/api-football-client'
import { useEffect, useState } from 'react'

interface AfMatchData {
  afFixtureId: number
  stats: AfTeamStats[]
  events: AfEvent[]
  lineups: AfTeamLineup[]
  players: AfTeamPlayers[]
}

interface MatchLivePanelProps {
  matchId: number
  isDark?: boolean
  onClose: () => void
}

function StatBar({
  label,
  home,
  away,
  isDark,
}: {
  label: string
  home: number | null | undefined
  away: number | null | undefined
  isDark: boolean
}) {
  if (home == null && away == null) return null
  const h = home ?? 0
  const a = away ?? 0
  const total = h + a || 1
  const homePct = Math.round((h / total) * 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] tabular-nums">
        <span className="font-semibold">{h}</span>
        <span className="text-stone-500 uppercase tracking-wide">{label}</span>
        <span className="font-semibold">{a}</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden flex ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`}>
        <div className="h-full bg-berry-500" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-sky-500 flex-1" />
      </div>
    </div>
  )
}

export default function MatchLivePanel({ matchId, isDark = true, onClose }: MatchLivePanelProps) {
  const theme = mundialTheme(isDark)
  const [afData, setAfData] = useState<AfMatchData | null>(null)
  const [afLoading, setAfLoading] = useState(false)

  useEffect(() => {
    if (!matchId) return
    setAfLoading(true)
    fetch(`/api/sports/af-match/${matchId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => setAfData(j))
      .catch(() => setAfData(null))
      .finally(() => setAfLoading(false))
  }, [matchId])

  const { data: stream, loading, error: streamError } = useLiveSportsStream<MatchStreamPayload>({
    channel: 'match',
    matchId,
    enabled: Boolean(matchId),
  })

  const data = stream
    ? {
        match: stream.match,
        stats: stream.stats,
        picks: stream.picks,
        userPrediction: stream.userPrediction,
        refreshedAt: stream.refreshedAt,
      }
    : null

  const displayError = streamError || ''

  const match = data?.match
  const score = match?.displayScore
  const winner = match ? getFinishedMatchWinner(match) : null

  return (
    <div className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center bg-black/75 backdrop-blur-sm p-0 lg:p-4">
      <div
        className={`w-full lg:max-w-lg max-h-[92vh] lg:max-h-[88vh] overflow-y-auto rounded-t-2xl lg:rounded-2xl border shadow-2xl ${theme.card}`}
      >
        <div className={`sticky top-0 z-10 border-b px-4 py-3 flex items-center justify-between ${theme.border} ${isDark ? 'bg-stone-950/95' : 'bg-white/95'} backdrop-blur`}>
          <div className="min-w-0">
            <p className={`text-[10px] uppercase tracking-wide ${theme.mutedSm}`}>
              {match?.groupLabel ?? match?.stageLabel ?? 'Partido'}
            </p>
            <p className="text-sm font-semibold truncate">
              {match ? `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}` : 'Cargando…'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold ${theme.btnOutline}`}
          >
            Cerrar
          </button>
        </div>

        {loading && !data && (
          <div className="flex justify-center py-16">
            <div className="w-9 h-9 border-4 border-berry-400/30 border-t-berry-400 rounded-full animate-spin" />
          </div>
        )}

        {displayError && !data && !loading && (
          <div className="p-6 text-center">
            <p className="text-red-400 text-sm">{displayError}</p>
          </div>
        )}

        {match && data && (
          <div className="p-4 sm:p-5 space-y-5">
            {/* Marcador */}
            <div className={`rounded-2xl border p-4 ${theme.cardSoft}`}>
              {winner && (
                <div
                  className={`mb-3 py-1.5 px-3 rounded-lg text-center text-xs font-bold ${
                    winner === 'draw'
                      ? isDark
                        ? 'bg-amber-500/15 text-amber-200'
                        : 'bg-amber-50 text-amber-800'
                      : isDark
                        ? 'bg-yellow-500/15 text-yellow-100'
                        : 'bg-yellow-50 text-yellow-900'
                  }`}
                >
                  {winner === 'draw'
                    ? '🤝 Empate'
                    : winner === 'home'
                      ? `⭐ Gana ${match.homeTeam.shortName}`
                      : `⭐ Gana ${match.awayTeam.shortName}`}
                </div>
              )}
              <div className="flex items-center justify-center gap-2 mb-3">
                {match.isLive && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    En vivo · {match.statusLabel}
                  </span>
                )}
                {match.isFinished && !match.isLive && (
                  <span className={`text-[10px] font-bold uppercase ${theme.mutedSm}`}>
                    {match.statusLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`flex-1 text-center rounded-xl py-2 ${
                    winner === 'home' ? (isDark ? 'bg-yellow-500/10 ring-1 ring-yellow-400/30' : 'bg-yellow-50') : ''
                  }`}
                >
                  <div className="relative inline-block">
                    <TeamCrest src={match.homeTeam.crest} alt="" size={44} className="mx-auto mb-2" />
                    {winnerBadge(winner, 'home') && (
                      <span className="absolute -top-1 -right-2 text-base">{winnerBadge(winner, 'home')}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold truncate">{match.homeTeam.shortName}</p>
                </div>
                <div className="shrink-0 flex flex-col gap-2 min-w-[7.5rem]">
                  <div
                    className={`rounded-xl border px-3 py-2 text-center ${
                      isDark ? 'border-emerald-500/30 bg-black/20' : 'border-emerald-200 bg-white'
                    }`}
                  >
                    <p className={`text-[9px] uppercase tracking-wide mb-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      Marcador en vivo
                    </p>
                    <p className="font-display text-2xl font-bold tabular-nums">
                      {score?.home ?? '–'}
                      <span className={`mx-1 text-base ${theme.muted}`}>:</span>
                      {score?.away ?? '–'}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl border px-3 py-2 text-center ${
                      data.userPrediction
                        ? isDark
                          ? 'border-berry-500/50 bg-berry-950/40'
                          : 'border-berry-300 bg-berry-50'
                        : isDark
                          ? 'border-white/10 bg-black/20'
                          : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <p className={`text-[9px] uppercase tracking-wide mb-0.5 ${theme.accent}`}>Tu marcador</p>
                    {data.userPrediction ? (
                      <p className={`font-display text-2xl font-bold tabular-nums ${isDark ? 'text-berry-300' : 'text-berry-700'}`}>
                        {data.userPrediction.homeScore}
                        <span className={`mx-1 text-base ${theme.muted}`}>:</span>
                        {data.userPrediction.awayScore}
                      </p>
                    ) : (
                      <p className={`text-xs py-1 ${theme.muted}`}>Sin pronóstico</p>
                    )}
                  </div>
                  {match.score.halfTime.home != null && match.score.halfTime.away != null && (
                    <p className={`text-[10px] text-center ${theme.mutedSm}`}>
                      HT {match.score.halfTime.home}-{match.score.halfTime.away}
                    </p>
                  )}
                </div>
                <div
                  className={`flex-1 text-center rounded-xl py-2 ${
                    winner === 'away' ? (isDark ? 'bg-yellow-500/10 ring-1 ring-yellow-400/30' : 'bg-yellow-50') : ''
                  }`}
                >
                  <div className="relative inline-block">
                    <TeamCrest src={match.awayTeam.crest} alt="" size={44} className="mx-auto mb-2" />
                    {winnerBadge(winner, 'away') && (
                      <span className="absolute -top-1 -right-2 text-base">{winnerBadge(winner, 'away')}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold truncate">{match.awayTeam.shortName}</p>
                </div>
              </div>
              {match.venue && (
                <p className={`text-center text-[10px] mt-3 ${theme.mutedSm}`}>{match.venue}</p>
              )}
            </div>

            {/* Goles */}
            {match.goals && match.goals.length > 0 && (
              <div>
                <p className={`text-xs font-semibold mb-2 ${theme.accent}`}>Goles</p>
                <ul className="space-y-2">
                  {[...match.goals].reverse().map((goal, i) => (
                    <li
                      key={`${goal.minute}-${goal.scorer?.name ?? i}`}
                      className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${theme.cardSoft}`}
                    >
                      <span className={`font-bold tabular-nums shrink-0 ${theme.accent}`}>
                        {`${goal.minute}'`}
                      </span>
                      <TeamCrest
                        src={
                          goal.team.id === match.homeTeam.id
                            ? match.homeTeam.crest
                            : match.awayTeam.crest
                        }
                        alt=""
                        size={18}
                      />
                      <span className="truncate">
                        {goal.scorer?.name ?? 'Gol'}
                        {goal.type === 'PENALTY' && ' (penal)'}
                        {goal.type === 'OWN_GOAL' && ' (ag.)'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Estadísticas */}
            {(match.homeTeam.statistics || match.awayTeam.statistics) && (
              <div>
                <p className={`text-xs font-semibold mb-3 ${theme.accent}`}>Estadísticas</p>
                <div className="space-y-3">
                  <StatBar
                    label="Posesión %"
                    home={match.homeTeam.statistics?.ball_possession}
                    away={match.awayTeam.statistics?.ball_possession}
                    isDark={isDark}
                  />
                  <StatBar
                    label="Tiros"
                    home={match.homeTeam.statistics?.shots}
                    away={match.awayTeam.statistics?.shots}
                    isDark={isDark}
                  />
                  <StatBar
                    label="A puerta"
                    home={match.homeTeam.statistics?.shots_on_goal}
                    away={match.awayTeam.statistics?.shots_on_goal}
                    isDark={isDark}
                  />
                  <StatBar
                    label="Córners"
                    home={match.homeTeam.statistics?.corners}
                    away={match.awayTeam.statistics?.corners}
                    isDark={isDark}
                  />
                </div>
              </div>
            )}

            {/* Estadísticas enriquecidas api-football.com */}
            {(afData || afLoading) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-semibold ${theme.accent}`}>Estadísticas Pro</p>
                  {afLoading && (
                    <div className="w-3.5 h-3.5 border-2 border-berry-400/40 border-t-berry-400 rounded-full animate-spin" />
                  )}
                </div>
                {afData && (
                  <MatchAfStats
                    stats={afData.stats}
                    events={afData.events}
                    lineups={afData.lineups}
                    players={afData.players}
                    homeTeamId={match.homeTeam.id}
                    isDark={isDark}
                  />
                )}
              </div>
            )}

            {/* Polla comunitaria */}
            <div>
              <p className={`text-xs font-semibold mb-2 ${theme.accent}`}>
                Polla · {data.stats.totalPicks} pronóstico{data.stats.totalPicks !== 1 ? 's' : ''}
              </p>

              {data.stats.totalPicks > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Local', pct: data.stats.homeWinPct },
                      { label: 'Empate', pct: data.stats.drawPct },
                      { label: 'Visitante', pct: data.stats.awayWinPct },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-lg border px-2 py-2 text-center ${theme.cardSoft}`}
                      >
                        <p className={`text-[9px] uppercase ${theme.mutedSm}`}>{item.label}</p>
                        <p className={`text-sm font-bold tabular-nums ${theme.accent}`}>{item.pct}%</p>
                      </div>
                    ))}
                  </div>
                  <p className={`text-[10px] mb-2 ${theme.mutedSm}`}>
                    Promedio pronosticado: {data.stats.avgHomeGoals} - {data.stats.avgAwayGoals}
                  </p>

                  {data.stats.distribution.length > 0 && (
                    <div className="mb-3">
                      <p className={`text-[10px] uppercase tracking-wide mb-2 ${theme.mutedSm}`}>
                        Marcadores más elegidos
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {data.stats.distribution.slice(0, 6).map((d) => (
                          <span
                            key={`${d.homeScore}-${d.awayScore}`}
                            className={`text-xs px-2.5 py-1 rounded-full border tabular-nums ${
                              isDark
                                ? 'border-white/10 bg-white/5'
                                : 'border-stone-200 bg-stone-50'
                            }`}
                          >
                            {d.homeScore}-{d.awayScore}{' '}
                            <span className={theme.mutedSm}>({d.count})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {data.picks.map((pick, i) => (
                      <div
                        key={`${pick.displayAlias}-${i}`}
                        className={`flex items-center justify-between text-xs rounded-lg px-3 py-2 border ${
                          pick.isCurrentUser
                            ? isDark
                              ? 'border-berry-500/40 bg-berry-950/30'
                              : 'border-berry-300 bg-berry-50'
                            : theme.cardSoft
                        }`}
                      >
                        <span className="truncate font-medium">{pick.displayAlias}</span>
                        <span className={`font-bold tabular-nums shrink-0 ml-2 ${theme.accent}`}>
                          {pick.homeScore}-{pick.awayScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className={`text-sm ${theme.muted}`}>Aún no hay pronósticos para este partido.</p>
              )}
            </div>

            {data.refreshedAt && (
              <p className={`text-[10px] text-center ${theme.mutedSm}`}>
                Actualizado {new Date(data.refreshedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                {match.isLive && ' · se actualiza cada 30 s'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
