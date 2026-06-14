'use client'

import TeamCrest from '@/components/sports/TeamCrest'
import type { MatchDetail } from '@/lib/football-data'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import type { MatchPrediction, MatchPredictionStats, PublicMatchPick } from '@/lib/sports-polla-shared'
import { useCallback, useEffect, useState } from 'react'

interface LiveMatchData {
  match: MatchDetail
  stats: MatchPredictionStats
  picks: PublicMatchPick[]
  userPrediction: MatchPrediction | null
  refreshedAt: string
}

function StatRow({
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
      <div className="flex justify-between text-[10px] sm:text-xs tabular-nums">
        <span className="font-semibold">{h}</span>
        <span className="text-stone-500 uppercase tracking-wide text-[9px] sm:text-[10px]">{label}</span>
        <span className="font-semibold">{a}</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden flex ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`}>
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-sky-500 flex-1" />
      </div>
    </div>
  )
}

interface LiveMatchBroadcastProps {
  matchIds: number[]
  isDark?: boolean
  onOpenDetail?: (matchId: number) => void
  className?: string
  /** Pronósticos del usuario (desde /api/sports/me) */
  userPredictions?: MatchPrediction[]
  /** inicio: tiempo y estadísticas más visibles en la pestaña Inicio */
  variant?: 'default' | 'inicio'
}

export default function LiveMatchBroadcast({
  matchIds,
  isDark = true,
  onOpenDetail,
  className = '',
  userPredictions = [],
  variant = 'default',
}: LiveMatchBroadcastProps) {
  const theme = mundialTheme(isDark)
  const [activeIdx, setActiveIdx] = useState(0)
  const matchId = matchIds[activeIdx] ?? matchIds[0]
  const [data, setData] = useState<LiveMatchData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!matchId) return
    try {
      const res = await fetch(`/api/sports/matches/${matchId}`)
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  useEffect(() => {
    const ms = variant === 'inicio' ? 30_000 : 45_000
    const interval = setInterval(load, ms)
    return () => clearInterval(interval)
  }, [load, variant])

  if (!matchId) return null

  const match = data?.match
  const score = match?.displayScore
  const userPick =
    userPredictions.find((p) => p.matchId === matchId) ?? data?.userPrediction ?? null
  const homeStats = match?.homeTeam.statistics
  const awayStats = match?.awayTeam.statistics
  const hasMatchStats =
    homeStats?.ball_possession != null ||
    homeStats?.shots != null ||
    homeStats?.shots_on_goal != null

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border ${
        isDark
          ? 'border-emerald-500/35 bg-gradient-to-br from-emerald-950/50 via-stone-950 to-berry-950/40'
          : 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-berry-50 shadow-lg'
      } ${className}`}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(52,211,153,0.25), transparent 70%)',
        }}
      />

      <div className="relative p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-widest ${
                isDark ? 'text-emerald-300' : 'text-emerald-700'
              }`}
            >
              Transmitiendo en vivo
            </span>
            {match && variant !== 'inicio' && (
              <span className={`text-xs font-semibold tabular-nums ${theme.muted}`}>
                · {match.statusLabel}
              </span>
            )}
          </div>
          {matchIds.length > 1 && (
            <div className="flex gap-1">
              {matchIds.map((id, i) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    i === activeIdx
                      ? 'bg-emerald-600 text-white'
                      : isDark
                        ? 'bg-white/10 text-stone-400'
                        : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && !match ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : match ? (
          <>
            {/* Marcadores: en vivo + tu pronóstico */}
            <div className="flex items-center gap-3 sm:gap-6 mb-4">
              <div className="flex-1 text-center min-w-0">
                <TeamCrest src={match.homeTeam.crest} alt="" size={52} className="mx-auto mb-2 sm:w-16 sm:h-16" />
                <p className={`text-sm sm:text-base font-bold truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  {match.homeTeam.shortName}
                </p>
              </div>

              <div className="shrink-0 flex flex-col gap-2 min-w-[9rem] sm:min-w-[11rem]">
                {variant === 'inicio' && (
                  <div
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full mx-auto ${
                      isDark
                        ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                        : 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-bold tabular-nums">{match.statusLabel}</span>
                  </div>
                )}

                <div
                  className={`rounded-xl border px-3 py-2 text-center ${
                    isDark ? 'border-emerald-500/30 bg-black/30' : 'border-emerald-200 bg-white'
                  }`}
                >
                  <p className={`text-[9px] uppercase tracking-wide mb-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    Marcador en vivo
                  </p>
                  <p
                    className={`font-display font-bold tabular-nums leading-none ${
                      variant === 'inicio' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                    } ${isDark ? 'text-white' : 'text-stone-900'}`}
                  >
                    {score?.home ?? '–'}
                    <span className={`mx-1 text-lg ${theme.muted}`}>:</span>
                    {score?.away ?? '–'}
                  </p>
                </div>

                <div
                  className={`rounded-xl border px-3 py-2 text-center ${
                    userPick
                      ? isDark
                        ? 'border-berry-500/50 bg-berry-950/40'
                        : 'border-berry-300 bg-berry-50'
                      : isDark
                        ? 'border-white/10 bg-black/20'
                        : 'border-stone-200 bg-stone-50'
                  }`}
                >
                  <p className={`text-[9px] uppercase tracking-wide mb-0.5 ${theme.accent}`}>
                    Tu marcador
                  </p>
                  {userPick ? (
                    <p
                      className={`font-display font-bold tabular-nums leading-none ${
                        variant === 'inicio' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                      } ${isDark ? 'text-berry-300' : 'text-berry-700'}`}
                    >
                      {userPick.homeScore}
                      <span className={`mx-1 text-lg ${theme.muted}`}>:</span>
                      {userPick.awayScore}
                    </p>
                  ) : (
                    <p className={`text-xs py-1 ${theme.muted}`}>Sin pronóstico</p>
                  )}
                </div>

                {match.score.halfTime.home != null && (
                  <p className={`text-[10px] text-center ${theme.mutedSm}`}>
                    HT {match.score.halfTime.home}-{match.score.halfTime.away}
                  </p>
                )}
              </div>

              <div className="flex-1 text-center min-w-0">
                <TeamCrest src={match.awayTeam.crest} alt="" size={52} className="mx-auto mb-2 sm:w-16 sm:h-16" />
                <p className={`text-sm sm:text-base font-bold truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  {match.awayTeam.shortName}
                </p>
              </div>
            </div>

            {/* Goles recientes */}
            {match.goals && match.goals.length > 0 && (
              <div
                className={`rounded-xl border px-3 py-2.5 mb-4 ${
                  isDark ? 'border-white/10 bg-black/25' : 'border-stone-200 bg-white/80'
                }`}
              >
                <p className={`text-[10px] uppercase tracking-wide mb-2 ${theme.mutedSm}`}>Goles</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {[...match.goals].reverse().slice(0, 5).map((goal, i) => (
                    <span key={`${goal.minute}-${i}`} className={`text-xs ${theme.body}`}>
                      <span className={`font-bold tabular-nums ${theme.accent}`}>{goal.minute}&apos;</span>{' '}
                      {goal.scorer?.name?.split(' ').pop() ?? 'Gol'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Estadísticas del partido */}
            {hasMatchStats && (
              <div
                className={`rounded-xl border p-3 sm:p-4 mb-4 ${
                  isDark ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-white/80'
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${theme.accent}`}>
                  Estadísticas en vivo
                </p>
                <div className={`space-y-3 ${variant === 'inicio' ? 'grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-x-6 space-y-0' : ''}`}>
                  <StatRow
                    label="Posesión %"
                    home={homeStats?.ball_possession}
                    away={awayStats?.ball_possession}
                    isDark={isDark}
                  />
                  <StatRow label="Tiros" home={homeStats?.shots} away={awayStats?.shots} isDark={isDark} />
                  {(variant === 'inicio' || homeStats?.shots_on_goal != null) && (
                    <StatRow
                      label="A puerta"
                      home={homeStats?.shots_on_goal}
                      away={awayStats?.shots_on_goal}
                      isDark={isDark}
                    />
                  )}
                  {variant === 'inicio' && (
                    <>
                      <StatRow label="Córners" home={homeStats?.corners} away={awayStats?.corners} isDark={isDark} />
                      <StatRow label="Faltas" home={homeStats?.fouls} away={awayStats?.fouls} isDark={isDark} />
                      <StatRow
                        label="Amarillas"
                        home={homeStats?.yellow_cards}
                        away={awayStats?.yellow_cards}
                        isDark={isDark}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Polla comunitaria — sin repetir tu pick (ya está arriba) */}
            <div className={`mb-4 ${hasMatchStats ? '' : ''}`}>
              {data && data.stats.totalPicks > 0 && (
                <div
                  className={`rounded-xl border p-3 ${
                    isDark ? 'border-berry-500/25 bg-berry-950/25' : 'border-berry-200 bg-berry-50/80'
                  }`}
                >
                  <p className={`text-[10px] uppercase tracking-wide mb-2 ${theme.mutedSm}`}>
                    Polla · {data.stats.totalPicks} pick{data.stats.totalPicks !== 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2 text-[10px]">
                    <span>
                      Local <strong>{data.stats.homeWinPct}%</strong>
                    </span>
                    <span>
                      Emp. <strong>{data.stats.drawPct}%</strong>
                    </span>
                    <span>
                      Vis. <strong>{data.stats.awayWinPct}%</strong>
                    </span>
                  </div>
                  {data.stats.distribution[0] && (
                    <p className={`text-[10px] mt-1.5 ${theme.mutedSm}`}>
                      Marcador más común:{' '}
                      <span className="font-semibold tabular-nums">
                        {data.stats.distribution[0].homeScore}-{data.stats.distribution[0].awayScore}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {onOpenDetail && (
                <button
                  type="button"
                  onClick={() => onOpenDetail(matchId)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isDark
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  Ver detalle completo y todos los picks
                </button>
              )}
              {data?.refreshedAt && (
                <p className={`text-[10px] text-center sm:self-center sm:px-2 ${theme.mutedSm}`}>
                  Actualizado{' '}
                  {new Date(data.refreshedAt).toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
