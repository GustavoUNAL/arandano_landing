'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  IconBall,
  IconGlobe,
  IconGroups,
  IconPremium,
  IconTarget,
  IconTrophy,
} from '@/components/sports/SportsIcons'
import HomeBroadcastPromo from '@/components/sports/HomeBroadcastPromo'
import KnockoutBracketsPreview from '@/components/sports/KnockoutBracketsPreview'
import PollaLeaderboard from '@/components/sports/PollaLeaderboard'
import GroupStagePodium from '@/components/sports/GroupStagePodium'
import PollaReglamento from '@/components/sports/PollaReglamento'
import PassportRequestPanel from '@/components/sports/PassportRequestPanel'
import TopScorersPanel from '@/components/sports/TopScorersPanel'
import TeamCrest from '@/components/sports/TeamCrest'
import UserAvatar from '@/components/sports/UserAvatar'
import type { ScoringRules } from '@/lib/polla-rules'
import { KNOCKOUT_TRAINING_NOTE, POINTS_CORRECT_RESULT, POINTS_EXACT_SCORE, POINTS_GOAL_DIFFERENCE } from '@/lib/polla-rules'
import { pointsToTier } from '@/lib/sports-polla-shared'
import type { LeaderboardEntry, MatchPrediction } from '@/lib/sports-polla-shared'
import type { WorldCupFullData } from '@/lib/football-data'
import { getGroupStagePodiumEntries, isGroupStageComplete } from '@/lib/polla-phase'
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
  leaderboardTraining?: LeaderboardEntry[]
  leaderboardKnockout?: LeaderboardEntry[]
  worldCup: WorldCupFullData
  onGoMundial: () => void
  onGoJugar: () => void
  onGoPicks: () => void
  onPlayMatch?: (matchId: number) => void
  onUpdateUsername?: (displayAlias: string) => Promise<void>
  onPassportChange?: () => void
  passportHolders?: number
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

function CampanaFaseGrupos({
  predictions,
  isDark,
}: {
  predictions: MatchPrediction[]
  isDark: boolean
}) {
  const theme = mundialTheme(isDark)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'exact' | 'goal_diff' | 'result' | 'miss'>('all')

  const groupPredictions = useMemo(
    () =>
      predictions
        .filter((p) => p.matchGroup != null)
        .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()),
    [predictions]
  )

  const settled = groupPredictions.filter((p) => p.settledAt != null)
  const stats = useMemo(() => {
    let exact = 0, goalDiff = 0, result = 0, miss = 0, points = 0
    for (const p of settled) {
      const tier = pointsToTier(p.pointsEarned)
      if (tier === 'exact') exact++
      else if (tier === 'goal_diff') goalDiff++
      else if (tier === 'result') result++
      else miss++
      points += p.pointsEarned ?? 0
    }
    return { exact, goalDiff, result, miss, points, total: settled.length }
  }, [settled])

  const filtered = useMemo(() => {
    if (filter === 'all') return groupPredictions
    return groupPredictions.filter((p) => {
      if (!p.settledAt) return filter === 'miss'
      return pointsToTier(p.pointsEarned) === filter
    })
  }, [groupPredictions, filter])

  if (groupPredictions.length === 0) return null

  return (
    <section className={`rounded-2xl border overflow-hidden ${theme.cardSoft}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full px-4 py-3 flex items-center justify-between gap-2 border-b ${theme.border} text-left`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <div>
            <p className="font-semibold text-sm">Mi campaña · Fase de Grupos</p>
            <p className={`text-[10px] ${theme.mutedSm}`}>
              {stats.total} picks liquidados · {stats.points} pts
            </p>
          </div>
        </div>
        <span className={`text-sm ${theme.mutedSm}`}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Exactos', value: stats.exact, color: isDark ? 'text-emerald-400' : 'text-emerald-700', bg: isDark ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200', pts: POINTS_EXACT_SCORE },
              { label: 'Diferencia', value: stats.goalDiff, color: isDark ? 'text-sky-400' : 'text-sky-700', bg: isDark ? 'bg-sky-950/40 border-sky-500/30' : 'bg-sky-50 border-sky-200', pts: POINTS_GOAL_DIFFERENCE },
              { label: 'Resultado', value: stats.result, color: isDark ? 'text-amber-400' : 'text-amber-700', bg: isDark ? 'bg-amber-950/40 border-amber-500/30' : 'bg-amber-50 border-amber-200', pts: POINTS_CORRECT_RESULT },
              { label: 'Fallidos', value: stats.miss, color: isDark ? 'text-stone-400' : 'text-stone-600', bg: isDark ? 'bg-stone-900/60 border-white/10' : 'bg-stone-100 border-stone-200', pts: 0 },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border px-2 py-2.5 text-center ${s.bg}`}>
                <p className={`font-bold text-lg tabular-nums ${s.color}`}>{s.value}</p>
                <p className={`text-[9px] font-semibold ${s.color}`}>{s.label}</p>
                <p className={`text-[9px] ${theme.mutedSm}`}>+{s.pts} pts</p>
              </div>
            ))}
          </div>

          {/* Total puntos */}
          <div className={`rounded-xl border px-4 py-2.5 flex items-center justify-between ${isDark ? 'border-berry-500/30 bg-berry-950/20' : 'border-berry-200 bg-berry-50'}`}>
            <p className={`text-sm font-semibold ${isDark ? 'text-berry-200' : 'text-berry-800'}`}>Total puntos fase de grupos</p>
            <p className={`font-bold text-xl tabular-nums ${isDark ? 'text-berry-300' : 'text-berry-700'}`}>{stats.points}</p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'exact', label: '✓ Exactos' },
                { id: 'goal_diff', label: '~ Diferencia' },
                { id: 'result', label: '○ Resultado' },
                { id: 'miss', label: '✗ Fallidos' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                  filter === f.id
                    ? 'bg-berry-600 text-white'
                    : isDark
                      ? 'bg-white/5 text-stone-400'
                      : 'bg-stone-100 text-stone-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de picks */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <p className={`text-xs text-center py-4 ${theme.mutedSm}`}>Sin picks en esta categoría</p>
            )}
            {filtered.map((p) => {
              const settled = p.settledAt != null
              const tier = settled ? pointsToTier(p.pointsEarned) : null
              const tierColor = !tier ? '' :
                tier === 'exact' ? (isDark ? 'text-emerald-400' : 'text-emerald-700') :
                tier === 'goal_diff' ? (isDark ? 'text-sky-400' : 'text-sky-700') :
                tier === 'result' ? (isDark ? 'text-amber-400' : 'text-amber-700') :
                (isDark ? 'text-stone-500' : 'text-stone-500')
              const tierLabel = !tier ? '' : tier === 'exact' ? 'Exacto' : tier === 'goal_diff' ? 'Diferencia' : tier === 'result' ? 'Resultado' : 'Fallo'
              return (
                <div key={p.id} className={`rounded-xl border px-3 py-2.5 text-xs ${theme.cardSoft}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium truncate ${theme.body}`}>
                      {p.homeTeamName} <span className={`font-bold tabular-nums ${isDark ? 'text-berry-300' : 'text-berry-600'}`}>{p.homeScore}-{p.awayScore}</span> {p.awayTeamName}
                    </p>
                    {settled && (
                      <span className={`shrink-0 font-bold text-[10px] ${tierColor}`}>
                        {p.pointsEarned != null && p.pointsEarned > 0 ? `+${p.pointsEarned}` : '0'} · {tierLabel}
                      </span>
                    )}
                  </div>
                  {settled && p.actualHomeScore != null && (
                    <p className={`mt-0.5 ${theme.mutedSm}`}>
                      Real: <span className="font-semibold tabular-nums">{p.actualHomeScore}-{p.actualAwayScore}</span>
                      {p.matchGroup && <span className="ml-2 opacity-60">{p.matchGroup.replace('GROUP_', 'Grupo ')}</span>}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
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
  leaderboardTraining = [],
  leaderboardKnockout = [],
  worldCup,
  onGoMundial,
  onGoJugar,
  onGoPicks,
  onPlayMatch,
  onUpdateUsername,
  onPassportChange,
  passportHolders = 0,
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
  const groupComplete = isGroupStageComplete(worldCup.allMatches)
  const podiumEntries = getGroupStagePodiumEntries(leaderboard, groupComplete)
  const upcoming = worldCup.upcomingMatches.slice(0, 8)

  return (
    <div className="space-y-4 lg:space-y-6">
      {podiumEntries.length > 0 && (
        <GroupStagePodium entries={podiumEntries} isDark={isDark} complete={groupComplete} />
      )}

      {/* Aviso nueva polla */}
      <div className={`rounded-2xl border px-4 py-3.5 flex gap-3 items-start ${isDark ? 'border-berry-500/30 bg-berry-950/20' : 'border-berry-200 bg-berry-50'}`}>
        <span className="text-xl shrink-0 mt-0.5">🏆</span>
        <div className="flex-1 min-w-0 space-y-1">
          <p className={`font-semibold text-sm ${isDark ? 'text-berry-200' : 'text-berry-800'}`}>
            ¡Nueva polla · Eliminatorias en marcha!
          </p>
          <p className={`text-xs leading-relaxed ${theme.muted}`}>
            La fase de grupos terminó — el marcador arranca desde cero. Tu campaña pasada queda guardada abajo.
          </p>
          <p className={`text-[11px] leading-relaxed ${theme.mutedSm}`}>
            {KNOCKOUT_TRAINING_NOTE}
          </p>
        </div>
      </div>

      {/* CTA pasaporte */}
      {!hasKnockoutPassport && (
        <a
          href="#pasaporte"
          className={`flex items-center gap-3 rounded-2xl border px-4 py-4 transition-all hover:scale-[1.01] ${
            isDark
              ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-stone-950 hover:border-amber-400/60'
              : 'border-amber-300 bg-gradient-to-r from-amber-50 to-white hover:border-amber-400 shadow-sm'
          }`}
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('pasaporte')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <span className="text-2xl shrink-0">🎟️</span>
          <div className="flex-1 min-w-0">
            <p className={`font-display font-bold text-sm ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
              Compra tu pasaporte · Polla final
            </p>
            <p className={`text-xs ${isDark ? 'text-amber-300/70' : 'text-amber-700'}`}>
              Desde cuartos de final · activa tu entrada a la polla oficial
            </p>
          </div>
          <span className={`text-sm font-bold shrink-0 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            Ver →
          </span>
        </a>
      )}

      {/* Campaña pasada */}
      <CampanaFaseGrupos predictions={predictions} isDark={isDark} />

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
                      title="Pasaporte polla final"
                    >
                      <IconPremium className="w-3 h-3" />
                      Polla final
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
                {
                  label: 'Pts (16vos)',
                  value: (leaderboardTraining.find((e) => e.isCurrentUser)?.totalPoints ?? 0).toLocaleString('es-CO'),
                },
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

          {/* Bienvenida polla de entrenamiento */}
          <div className={`rounded-2xl border px-4 py-4 ${isDark ? 'border-emerald-500/25 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50'}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🏋️</span>
              <div>
                <p className={`font-display font-bold text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
                  ¡Bienvenido a la polla de entrenamiento!
                </p>
                <p className={`text-xs mt-1 leading-relaxed ${theme.muted}`}>
                  Octavos y dieciseisavos son de entrenamiento — juega sin apostar. Los puntos no cuentan para la polla final.
                </p>
                <p className={`text-[11px] mt-1 ${theme.mutedSm}`}>
                  Desde cuartos de final arranca la polla oficial con pasaporte.
                </p>
              </div>
            </div>
          </div>

          <div id="pasaporte">
            <PassportRequestPanel
              isDark={isDark}
              hasKnockoutPassport={hasKnockoutPassport}
              passportHolders={passportHolders}
              onPassportActivated={onPassportChange}
            />
          </div>

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

          <KnockoutBracketsPreview
            rounds={worldCup.knockoutRounds}
            isDark={isDark}
            hasPassport={hasKnockoutPassport}
            onPlayMatch={onPlayMatch}
            onBuyPassport={() =>
              document.getElementById('pasaporte')?.scrollIntoView({ behavior: 'smooth' })
            }
          />

          {/* Próximos partidos */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm lg:text-base">Próximos partidos</h3>
              <button type="button" onClick={onGoJugar} className={`text-xs font-medium ${theme.accentLink}`}>
                Pronosticar →
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {upcoming.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => (onPlayMatch ? onPlayMatch(m.id) : onGoJugar())}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all hover:scale-[1.01] hover:border-berry-500/40 hover:shadow-md ${theme.cardSoft}`}
                >
                  <TeamCrest src={m.homeTeam.crest} alt="" size={28} />
                  <div className="flex-1 min-w-0 text-center">
                    <p className="text-xs font-medium truncate">
                      {teamLabel(m.homeTeam)} <span className={theme.mutedSm}>vs</span> {teamLabel(m.awayTeam)}
                    </p>
                    <p className={`text-[10px] ${theme.mutedSm}`}>{m.formattedDate}</p>
                  </div>
                  <TeamCrest src={m.awayTeam.crest} alt="" size={28} />
                  <span className={`text-[10px] font-bold w-14 text-right shrink-0 ${theme.accent}`}>
                    Jugar →
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Columna lateral: tablas */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:space-y-6">
          <PollaLeaderboard
            entries={leaderboardTraining}
            isDark={isDark}
            phase="training"
            title="Tabla entrenamiento 16vos"
            subtitle="Puntos de entrenamiento · no cuentan en polla final"
            onUpdateUsername={onUpdateUsername}
          />
          <PollaLeaderboard
            entries={leaderboardKnockout}
            isDark={isDark}
            phase="knockout"
            compact
            title="Polla final"
            subtitle="Desde cuartos · requiere pasaporte"
          />
          {/* Tabla fase de grupos: histórica colapsable */}
          <details className="group">
            <summary className={`cursor-pointer text-xs font-semibold px-1 py-2 list-none flex items-center gap-2 ${theme.muted}`}>
              <span className="inline-block transition-transform group-open:rotate-90">▶</span>
              Tabla fase de grupos (terminada)
            </summary>
            <div className="mt-2">
              <PollaLeaderboard entries={leaderboard} isDark={isDark} phase="group" compact />
            </div>
          </details>
          <TopScorersPanel isDark={isDark} />
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
        <div className="grid gap-2 lg:grid-cols-2">
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
