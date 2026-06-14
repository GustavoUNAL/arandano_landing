'use client'

import { useEffect, useState } from 'react'
import {
  IconBall,
  IconGlobe,
  IconGroups,
  IconPremium,
  IconTarget,
  IconTrophy,
} from '@/components/sports/SportsIcons'
import HomeBroadcastPromo from '@/components/sports/HomeBroadcastPromo'
import PollaLeaderboard from '@/components/sports/PollaLeaderboard'
import PollaReglamento from '@/components/sports/PollaReglamento'
import TeamCrest from '@/components/sports/TeamCrest'
import UserAvatar from '@/components/sports/UserAvatar'
import type { ScoringRules } from '@/lib/polla-rules'
import type { LeaderboardEntry, MatchPrediction } from '@/lib/sports-polla-shared'
import type { WorldCupFullData } from '@/lib/football-data'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { MUNDIAL_2026 } from '@/lib/world-cup-info'

interface PerfilInicioProps {
  isDark?: boolean
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
  displayAlias?: string | null
  hasKnockoutPassport?: boolean
  totalPoints: number
  credits: number
  predictionCost: number
  scoringRules: ScoringRules
  predictions: MatchPrediction[]
  leaderboard: LeaderboardEntry[]
  leaderboardKnockout?: LeaderboardEntry[]
  worldCup: WorldCupFullData
  onGoMundial: () => void
  onGoJugar: () => void
  onGoPicks: () => void
  onPlayMatch?: (matchId: number) => void
  onUpdateUsername?: (displayAlias: string) => Promise<void>
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function groupStageCounts(worldCup: WorldCupFullData) {
  const groupMatches = worldCup.allMatches.filter((m) => m.stage === 'GROUP_STAGE')
  const remaining = groupMatches.filter((m) => !m.isFinished).length
  return { total: groupMatches.length, remaining }
}

function teamLabel(team: { shortName?: string; name?: string; tla?: string }) {
  return team.shortName || team.name || team.tla || '—'
}

export default function PerfilInicio({
  isDark = true,
  userName,
  userEmail,
  userImage,
  displayAlias,
  hasKnockoutPassport = false,
  totalPoints,
  credits,
  predictionCost,
  scoringRules: _scoringRules,
  predictions,
  leaderboard,
  leaderboardKnockout = [],
  worldCup,
  onGoMundial,
  onGoJugar,
  onGoPicks,
  onPlayMatch,
  onUpdateUsername,
}: PerfilInicioProps) {
  const theme = mundialTheme(isDark)
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameDraft, setUsernameDraft] = useState(displayAlias ?? '')
  const [usernameError, setUsernameError] = useState('')
  const [savingUsername, setSavingUsername] = useState(false)

  useEffect(() => {
    if (!editingUsername) setUsernameDraft(displayAlias ?? '')
  }, [displayAlias, editingUsername])

  const saveUsername = async () => {
    if (!onUpdateUsername) return
    setSavingUsername(true)
    setUsernameError('')
    try {
      await onUpdateUsername(usernameDraft)
      setEditingUsername(false)
    } catch (e) {
      setUsernameError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setSavingUsername(false)
    }
  }

  const daysToStart = daysUntil(worldCup.competition.startDate)
  const tournamentStarted = daysToStart === 0
  const { total: groupTotal, remaining: groupRemaining } = groupStageCounts(worldCup)
  const upcoming = worldCup.upcomingMatches.slice(0, 4)
  const colombiaTeam = worldCup.teams.find((t) => t.name === 'Colombia')

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* Columna principal */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4 lg:space-y-6">
          {/* Hero usuario */}
          <div className={`relative overflow-hidden rounded-2xl border p-5 lg:p-6 ${theme.profileHero}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative flex items-center gap-4">
              <UserAvatar
                src={userImage}
                name={userName}
                size={64}
                className={`ring-2 lg:w-[72px] lg:h-[72px] ${theme.profileHeroAvatar}`}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] uppercase tracking-widest font-semibold ${theme.profileHeroMuted}`}>
                  Polla Mundialista
                </p>
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <h1 className={`font-display text-xl lg:text-2xl font-bold truncate ${theme.profileHeroTitle}`}>
                    {userName ?? 'Jugador'}
                  </h1>
                  {hasKnockoutPassport && (
                    <span
                      className={`inline-flex items-center gap-1 shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isDark
                          ? 'bg-berry-500/25 text-berry-200 border border-berry-400/40'
                          : 'bg-berry-100 text-berry-800 border border-berry-300'
                      }`}
                      title="Pasaporte eliminatorias"
                    >
                      <IconPremium className="w-3 h-3" />
                      Eliminatorias
                    </span>
                  )}
                </div>
                <p className={`text-xs truncate ${theme.profileHeroMuted}`}>{userEmail}</p>
              </div>
            </div>
            <div className="relative mt-4 grid grid-cols-3 gap-2 lg:gap-3">
              {[
                { label: 'Créditos', value: credits.toLocaleString('es-CO') },
                { label: 'Pronósticos', value: predictions.length.toLocaleString('es-CO') },
                { label: 'Puntos', value: totalPoints.toLocaleString('es-CO') },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-xl border px-2 py-2.5 text-center ${theme.profileHeroStat}`}
                >
                  <p className={`text-[9px] uppercase tracking-wide leading-tight ${theme.profileHeroMuted}`}>
                    {stat.label}
                  </p>
                  <p className={`font-display text-lg lg:text-xl font-bold tabular-nums mt-1 ${theme.profileHeroStatValue}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            {onUpdateUsername && (
              <div className={`relative mt-3 text-xs min-w-0 ${theme.profileHeroEdit}`}>
                {editingUsername ? (
                  <div className="space-y-1.5 text-left">
                    <label className={`text-[10px] uppercase tracking-wide block font-medium ${theme.profileHeroMuted}`}>
                      Nombre en la tabla
                    </label>
                    <input
                      type="text"
                      value={usernameDraft}
                      onChange={(e) => setUsernameDraft(e.target.value)}
                      maxLength={24}
                      placeholder="Tu nombre público"
                      className={`w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none ${theme.profileHeroInput}`}
                      disabled={savingUsername}
                    />
                    {usernameError && (
                      <p className={`text-[10px] ${isDark ? 'text-red-300' : 'text-red-600'}`}>{usernameError}</p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUsername(false)
                          setUsernameError('')
                          setUsernameDraft(displayAlias ?? '')
                        }}
                        className={`text-[10px] ${theme.profileHeroMuted}`}
                        disabled={savingUsername}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={saveUsername}
                        disabled={savingUsername || !usernameDraft.trim()}
                        className={`text-[10px] font-semibold disabled:opacity-50 ${theme.accent}`}
                      >
                        {savingUsername ? 'Guardando…' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingUsername(true)}
                    className={`text-[10px] text-right w-full ${theme.profileHeroEdit}`}
                  >
                    Tabla: <span className={`font-semibold ${theme.profileHeroTitle}`}>{displayAlias ?? 'Sin nombre'}</span>
                    <span className="ml-1">· Editar</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Transmisión + pronósticos del siguiente partido */}
          <HomeBroadcastPromo
            isDark={isDark}
            onPredict={(matchId) => (onPlayMatch ? onPlayMatch(matchId) : onGoJugar())}
          />

          {/* Countdown Mundial */}
          <div
            className={`rounded-2xl border p-4 lg:p-5 overflow-hidden relative ${
              isDark
                ? 'border-white/10 bg-gradient-to-r from-stone-900 to-stone-950'
                : 'border-berry-200/90 bg-gradient-to-br from-white via-berry-50/90 to-berry-100/60 shadow-md shadow-berry-100/50'
            }`}
          >
            <div
              className={`absolute inset-0 pointer-events-none ${
                isDark
                  ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-berry-600/10 via-transparent to-transparent'
                  : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-berry-300/25 via-transparent to-transparent'
              }`}
            />
            <div className="relative flex items-center gap-4">
              <TeamCrest src={worldCup.competition.emblem} alt="Mundial" size={52} />
              <div className="flex-1 min-w-0">
                <h2
                  className={`font-display font-bold text-base lg:text-lg ${
                    isDark ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  Mundial FIFA 2026
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-stone-400' : 'text-stone-700'}`}>
                  {worldCup.stats.totalTeams} selecciones · {worldCup.stats.totalMatches} partidos
                </p>
                <p className={`text-[11px] mt-1 font-medium ${isDark ? 'text-berry-300/90' : 'text-berry-700'}`}>
                  {tournamentStarted
                    ? groupRemaining > 0
                      ? `Quedan ${groupRemaining} de ${groupTotal} partidos en fase de grupos`
                      : 'Fase de grupos finalizada'
                    : `Fase de grupos: ${groupTotal} partidos`}
                </p>
              </div>
              <div
                className={`text-center shrink-0 rounded-xl px-3 py-2 min-w-[4.5rem] ${
                  isDark
                    ? 'bg-berry-600/20 border border-berry-500/30'
                    : 'bg-berry-600 border border-berry-700 shadow-sm'
                }`}
              >
                <p
                  className={`font-display text-2xl font-bold tabular-nums leading-none ${
                    isDark ? 'text-berry-300' : 'text-white'
                  }`}
                >
                  {tournamentStarted ? groupRemaining : daysToStart}
                </p>
                <p
                  className={`text-[9px] uppercase mt-1 font-semibold tracking-wide ${
                    isDark ? 'text-stone-400' : 'text-berry-100'
                  }`}
                >
                  {tournamentStarted ? (groupRemaining === 1 ? 'partido' : 'en grupos') : 'días'}
                </p>
              </div>
            </div>
            <div
              className={`relative grid grid-cols-3 gap-2 mt-4 p-2 rounded-xl ${
                isDark ? '' : 'bg-white/70 border border-berry-200/60'
              }`}
            >
              {[
                {
                  label: 'Inicio',
                  date: new Date(worldCup.competition.startDate),
                },
                {
                  label: 'Final',
                  date: new Date(worldCup.competition.endDate),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border py-2.5 px-1 text-center ${
                    isDark
                      ? 'bg-white/5 border-white/10'
                      : 'bg-gradient-to-b from-white to-berry-50/80 border-berry-300 shadow-sm'
                  }`}
                >
                  <p
                    className={`font-display text-xl font-bold tabular-nums leading-none ${
                      isDark ? 'text-white' : 'text-berry-800'
                    }`}
                  >
                    {item.date.toLocaleDateString('es-CO', { day: 'numeric' })}
                  </p>
                  <p
                    className={`text-[10px] font-semibold capitalize mt-0.5 ${
                      isDark ? 'text-berry-300/90' : 'text-berry-700'
                    }`}
                  >
                    {item.date.toLocaleDateString('es-CO', { month: 'short' })}
                  </p>
                  <p
                    className={`text-[9px] uppercase mt-1 font-bold tracking-wider ${
                      isDark ? 'text-stone-500' : 'text-stone-600'
                    }`}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
              <div
                className={`rounded-xl border py-2.5 px-1 text-center flex flex-col justify-center ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gradient-to-b from-white to-emerald-50/80 border-emerald-300 shadow-sm'
                }`}
              >
                <p className="text-lg leading-none">🇺🇸🇲🇽🇨🇦</p>
                <p
                  className={`text-[9px] uppercase mt-1.5 font-bold tracking-wider ${
                    isDark ? 'text-stone-500' : 'text-stone-600'
                  }`}
                >
                  Sedes
                </p>
              </div>
            </div>
          </div>

          {/* Colombia */}
          {worldCup.colombiaQualified && colombiaTeam && (
            <div
              className={`rounded-2xl border p-4 ${
                isDark
                  ? 'border-yellow-500/30 bg-gradient-to-r from-yellow-950/40 via-berry-950/40 to-stone-950'
                  : 'border-amber-200 bg-gradient-to-r from-amber-50 via-berry-50 to-white shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <TeamCrest src={colombiaTeam.crest} alt="Colombia" size={44} />
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-yellow-400' : 'text-amber-700'}`}>
                    🇨🇴 La Tricolor
                  </p>
                  <p className="font-semibold">Colombia en el Mundial</p>
                  {colombiaTeam.coach && <p className={`text-[10px] ${theme.mutedSm}`}>DT: {colombiaTeam.coach}</p>}
                </div>
              </div>
              {worldCup.colombiaNextMatch && (
                <div
                  className={`rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 ${
                    isDark ? 'bg-black/30' : 'bg-white/80 border border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamCrest src={worldCup.colombiaNextMatch.homeTeam.crest} alt="" size={24} />
                    <span className="text-xs font-medium truncate">
                      {teamLabel(worldCup.colombiaNextMatch.homeTeam)} vs{' '}
                      {teamLabel(worldCup.colombiaNextMatch.awayTeam)}
                    </span>
                    <TeamCrest src={worldCup.colombiaNextMatch.awayTeam.crest} alt="" size={24} />
                  </div>
                  <span className={`text-[10px] shrink-0 ${theme.accentLink}`}>
                    {worldCup.colombiaNextMatch.startsIn}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Próximos partidos */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm lg:text-base">Próximos partidos</h3>
              <button type="button" onClick={onGoJugar} className={`text-xs font-medium ${theme.accentLink}`}>
                Pronosticar →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {upcoming.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => (onPlayMatch ? onPlayMatch(m.id) : onGoJugar())}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-all hover:scale-[1.01] hover:border-berry-500/40 hover:shadow-md sm:flex-row sm:gap-3 sm:px-3 sm:text-left ${theme.cardSoft}`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:hidden">
                    <TeamCrest src={m.homeTeam.crest} alt="" size={24} />
                    <span className={`text-[10px] font-bold ${theme.mutedSm}`}>vs</span>
                    <TeamCrest src={m.awayTeam.crest} alt="" size={24} />
                  </div>
                  <TeamCrest src={m.homeTeam.crest} alt="" size={28} className="hidden sm:block shrink-0" />
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <p className="text-[10px] sm:text-xs font-medium leading-snug line-clamp-2 sm:truncate">
                      {teamLabel(m.homeTeam)} <span className={theme.mutedSm}>vs</span> {teamLabel(m.awayTeam)}
                    </p>
                    <p className={`text-[9px] sm:text-[10px] mt-0.5 ${theme.mutedSm}`}>{m.formattedDate}</p>
                  </div>
                  <TeamCrest src={m.awayTeam.crest} alt="" size={28} className="hidden sm:block shrink-0" />
                  <span className={`hidden sm:inline text-[10px] font-bold w-14 text-right shrink-0 ${theme.accent}`}>
                    Jugar →
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Columna lateral: tabla + reglamento */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:space-y-6">
          <PollaLeaderboard entries={leaderboard} isDark={isDark} phase="group" />
          <PollaLeaderboard entries={leaderboardKnockout} isDark={isDark} phase="knockout" compact />
          <PollaReglamento compact isDark={isDark} />
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
        {[
          { Icon: IconGroups, label: 'Grupos', value: `${worldCup.groups.length}`, sub: 'de 4 equipos' },
          { Icon: IconTrophy, label: 'Fases', value: `${worldCup.knockoutRounds.length}`, sub: 'eliminatorias' },
          { Icon: IconTarget, label: 'Costo por pick', value: predictionCost.toLocaleString('es-CO'), sub: 'créditos' },
          { Icon: IconBall, label: 'Partidos', value: `${worldCup.stats.totalMatches}`, sub: 'en el torneo' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 lg:p-4 ${theme.cardSoft}`}>
            <s.Icon className={`w-5 h-5 ${theme.accentLink}`} />
            <p className={`font-display text-lg lg:text-xl font-bold mt-2 ${theme.accent}`}>{s.value}</p>
            <p className={`text-[10px] ${theme.mutedSm}`}>
              {s.label} · {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Formato */}
      <div className={`rounded-2xl border p-4 lg:p-5 ${theme.cardSoft}`}>
        <h3 className="font-semibold text-sm lg:text-base mb-3">Formato del torneo</h3>
        <div className="grid grid-cols-2 gap-2 lg:gap-3">
          {MUNDIAL_2026.format.map((line, i) => (
            <div key={line} className="flex gap-3 items-start">
              <span
                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                  isDark ? 'bg-berry-600/30 text-berry-300' : 'bg-berry-100 text-berry-700'
                }`}
              >
                {i + 1}
              </span>
              <p className={`text-xs leading-relaxed ${theme.muted}`}>{line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Últimos pronósticos */}
      {predictions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm lg:text-base">Tus últimos picks</h3>
            <button type="button" onClick={onGoPicks} className={`text-xs ${theme.accentLink}`}>
              Ver todos →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {predictions.slice(-3).reverse().map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  isDark ? 'bg-berry-950/30 border-berry-500/20' : 'bg-berry-50 border-berry-200'
                }`}
              >
                <span className={theme.body}>{p.homeTeamName}</span>{' '}
                <strong className={`text-sm ${theme.accent}`}>
                  {p.homeScore}-{p.awayScore}
                </strong>{' '}
                <span className={theme.body}>{p.awayTeamName}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-2 lg:gap-3 pt-1 max-w-xl lg:max-w-md">
        <button
          type="button"
          onClick={onGoMundial}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-colors ${theme.btnOutline}`}
        >
          <IconGlobe className="w-4 h-4" />
          Explorar Mundial
        </button>
        <button
          type="button"
          onClick={onGoJugar}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-berry-600 hover:bg-berry-500 text-sm font-semibold text-white shadow-lg shadow-berry-900/20 transition-colors"
        >
          <IconTarget className="w-4 h-4" />
          Jugar ahora
        </button>
      </div>
    </div>
  )
}
