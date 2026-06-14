'use client'

import TeamCrest from '@/components/sports/TeamCrest'
import type { EnrichedMatch, MatchDetail } from '@/lib/football-data'
import { getKickoffCountdown } from '@/lib/home-broadcast'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { PERFIL_JUGAR_PATH } from '@/lib/perfil-routes'
import type { MatchPredictionStats, PublicMatchPick } from '@/lib/sports-polla-shared'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface HomeBroadcastPayload {
  mode: 'live' | 'upcoming'
  countdown: { hours: number; minutes: number; label: string; msUntilKickoff: number } | null
  match: EnrichedMatch | MatchDetail
  stats: MatchPredictionStats
  picks: PublicMatchPick[]
  totalPicks: number
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
        <span className="text-stone-500 uppercase tracking-wide text-[9px]">{label}</span>
        <span className="font-semibold">{a}</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden flex ${isDark ? 'bg-stone-800' : 'bg-stone-200'}`}>
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-sky-500 flex-1" />
      </div>
    </div>
  )
}

interface HomeBroadcastPromoProps {
  isDark: boolean
  onPredict?: (matchId: number) => void
}

export default function HomeBroadcastPromo({ isDark, onPredict }: HomeBroadcastPromoProps) {
  const theme = mundialTheme(isDark)
  const [data, setData] = useState<HomeBroadcastPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/sports/home-broadcast')
      const json = await res.json()
      if (res.ok && json.featured) setData(json.featured)
      else setData(null)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const refresh = setInterval(load, 60_000)
    const countdown = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => {
      clearInterval(refresh)
      clearInterval(countdown)
    }
  }, [load])

  if (loading) {
    return (
      <div
        className={`rounded-2xl border p-8 flex justify-center ${
          isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-white shadow-lg'
        }`}
      >
        <div className="w-9 h-9 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  const { match, mode, stats, picks } = data
  // tick actualiza el contador cada 30 s sin esperar al fetch
  const countdown =
    mode === 'upcoming' ? getKickoffCountdown(match.utcDate) : data.countdown
  void tick
  const score = match.displayScore
  const homeStats = 'homeTeam' in match && 'statistics' in match.homeTeam ? match.homeTeam.statistics : null
  const awayStats = 'awayTeam' in match && 'statistics' in match.awayTeam ? match.awayTeam.statistics : null
  const hasLiveStats =
    homeStats?.ball_possession != null ||
    homeStats?.shots != null ||
    homeStats?.shots_on_goal != null

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-2xl transition-colors ${
        isDark
          ? 'border-emerald-500/35 bg-gradient-to-br from-emerald-950/50 via-stone-950 to-berry-950/40'
          : 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-berry-50'
      }`}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(52,211,153,0.25), transparent 70%)',
        }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Countdown / live banner */}
        <div
          className={`rounded-xl border px-4 py-3 mb-4 text-center ${
            mode === 'live'
              ? isDark
                ? 'border-emerald-500/40 bg-emerald-950/50'
                : 'border-emerald-300 bg-emerald-100/80'
              : isDark
                ? 'border-berry-500/30 bg-berry-950/40'
                : 'border-berry-200 bg-berry-50'
          }`}
        >
          {mode === 'live' ? (
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <p className={`text-sm sm:text-base font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                Transmitiendo en vivo
              </p>
              <span className={`text-xs font-semibold ${theme.muted}`}>· {match.statusLabel}</span>
            </div>
          ) : (
            <>
              <p className={`text-[10px] uppercase tracking-widest mb-1 ${theme.mutedSm}`}>
                Transmisión en vivo
              </p>
              <p className={`text-lg sm:text-xl font-display font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                Empieza en{' '}
                <span className={isDark ? 'text-berry-300' : 'text-berry-600'}>
                  {countdown?.label ?? '—'}
                </span>
              </p>
              {countdown && countdown.hours > 0 && (
                <p className={`text-xs mt-1 tabular-nums ${theme.muted}`}>
                  {countdown.hours} hora{countdown.hours !== 1 ? 's' : ''} y {countdown.minutes} min
                </p>
              )}
            </>
          )}
        </div>

        {/* Partido */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 text-center min-w-0">
            <TeamCrest src={match.homeTeam.crest} alt="" size={48} className="mx-auto mb-1.5" />
            <p className={`text-xs sm:text-sm font-bold truncate ${theme.profileHeroTitle}`}>
              {match.homeTeam.shortName || match.homeTeam.name}
            </p>
          </div>
          <div className="shrink-0 text-center px-2">
            {score?.home != null ? (
              <p className={`font-display text-2xl sm:text-3xl font-bold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {score.home} - {score.away}
              </p>
            ) : (
              <p className={`text-lg font-bold ${theme.muted}`}>VS</p>
            )}
            <p className={`text-[10px] mt-0.5 ${theme.mutedSm}`}>{match.formattedDate}</p>
          </div>
          <div className="flex-1 text-center min-w-0">
            <TeamCrest src={match.awayTeam.crest} alt="" size={48} className="mx-auto mb-1.5" />
            <p className={`text-xs sm:text-sm font-bold truncate ${theme.profileHeroTitle}`}>
              {match.awayTeam.shortName || match.awayTeam.name}
            </p>
          </div>
        </div>

        {/* Estadísticas en vivo del partido */}
        {hasLiveStats && (
          <div
            className={`rounded-xl border p-3 mb-4 ${
              isDark ? 'border-white/10 bg-black/20' : 'border-stone-200 bg-white/90'
            }`}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-wide mb-2.5 ${theme.accent}`}>
              Estadísticas del partido
            </p>
            <div className="space-y-2.5">
              <StatBar label="Posesión %" home={homeStats?.ball_possession} away={awayStats?.ball_possession} isDark={isDark} />
              <StatBar label="Tiros" home={homeStats?.shots} away={awayStats?.shots} isDark={isDark} />
              <StatBar label="A puerta" home={homeStats?.shots_on_goal} away={awayStats?.shots_on_goal} isDark={isDark} />
            </div>
          </div>
        )}

        {/* Polla — quién apuesta */}
        <div
          className={`rounded-xl border p-3 mb-4 ${
            isDark ? 'border-berry-500/25 bg-berry-950/25' : 'border-berry-200 bg-berry-50/90'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${theme.accent}`}>
              Pronósticos al siguiente partido
            </p>
            <span className={`text-[10px] tabular-nums ${theme.mutedSm}`}>
              {stats.totalPicks} pick{stats.totalPicks !== 1 ? 's' : ''}
            </span>
          </div>

          {stats.totalPicks > 0 ? (
            <>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] mb-3">
                <span>
                  Local <strong className={theme.accent}>{stats.homeWinPct}%</strong>
                </span>
                <span>
                  Empate <strong>{stats.drawPct}%</strong>
                </span>
                <span>
                  Visitante <strong>{stats.awayWinPct}%</strong>
                </span>
                <span className={theme.mutedSm}>
                  · Prom. {stats.avgHomeGoals}-{stats.avgAwayGoals}
                </span>
              </div>

              <ul className={`space-y-1.5 max-h-36 overflow-y-auto pr-1 ${theme.mutedSm}`}>
                {picks.map((pick, i) => (
                  <li
                    key={`${pick.displayAlias}-${pick.homeScore}-${pick.awayScore}-${i}`}
                    className={`flex items-center justify-between gap-2 text-xs rounded-lg px-2 py-1.5 ${
                      pick.isCurrentUser
                        ? isDark
                          ? 'bg-berry-600/20 border border-berry-500/30'
                          : 'bg-berry-100 border border-berry-200'
                        : isDark
                          ? 'bg-black/20'
                          : 'bg-white/80'
                    }`}
                  >
                    <span className={`font-medium truncate ${pick.isCurrentUser ? theme.accent : ''}`}>
                      {pick.displayAlias}
                      {pick.isCurrentUser ? ' (tú)' : ''}
                    </span>
                    <span className="font-bold tabular-nums shrink-0">
                      {pick.homeScore} - {pick.awayScore}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={`text-xs ${theme.muted}`}>
              Aún nadie ha pronosticado este partido. Sé el primero en la polla.
            </p>
          )}
        </div>

        {onPredict ? (
          <button
            type="button"
            onClick={() => onPredict(match.id)}
            className="w-full py-2.5 rounded-xl bg-berry-600 hover:bg-berry-500 text-white text-sm font-semibold transition-colors"
          >
            Pronosticar este partido
          </button>
        ) : (
          <Link
            href={`${PERFIL_JUGAR_PATH}&match=${match.id}`}
            className="block w-full py-2.5 rounded-xl bg-berry-600 hover:bg-berry-500 text-white text-sm font-semibold text-center transition-colors"
          >
            Pronosticar este partido
          </Link>
        )}
      </div>
    </div>
  )
}
