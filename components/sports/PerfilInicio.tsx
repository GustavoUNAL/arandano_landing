'use client'

import { useEffect, useState } from 'react'
import {
  IconBall,
  IconGlobe,
  IconGroups,
  IconTarget,
  IconTrophy,
} from '@/components/sports/SportsIcons'
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
  totalPoints: number
  credits: number
  predictionCost: number
  scoringRules: ScoringRules
  predictions: MatchPrediction[]
  leaderboard: LeaderboardEntry[]
  worldCup: WorldCupFullData
  onGoMundial: () => void
  onGoJugar: () => void
  onGoPicks: () => void
  onUpdateUsername?: (displayAlias: string) => Promise<void>
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
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
  totalPoints,
  credits,
  predictionCost,
  scoringRules,
  predictions,
  leaderboard,
  worldCup,
  onGoMundial,
  onGoJugar,
  onGoPicks,
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
  const upcoming = worldCup.upcomingMatches.slice(0, 4)
  const colombiaTeam = worldCup.teams.find((t) => t.name === 'Colombia')

  return (
    <div className="space-y-4">
      {/* Hero usuario */}
      <div className="relative overflow-hidden rounded-2xl border border-berry-500/20 bg-gradient-to-br from-berry-700 via-berry-800 to-berry-950 p-5 shadow-lg shadow-berry-950/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-center gap-4">
          <UserAvatar src={userImage} name={userName} size={64} className="border-white/40 ring-2 ring-white/20" />
          <div className="flex-1 min-w-0">
            <p className="text-berry-200/80 text-[10px] uppercase tracking-widest font-semibold">Polla Mundialista</p>
            <h1 className="font-display text-xl font-bold truncate">{userName ?? 'Jugador'}</h1>
            <p className="text-berry-200/70 text-xs truncate">{userEmail}</p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Créditos disponibles', value: credits.toLocaleString('es-CO') },
            { label: 'Pronósticos realizados', value: predictions.length.toLocaleString('es-CO') },
            { label: 'Puntos acumulados', value: totalPoints.toLocaleString('es-CO') },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-black/20 border border-white/10 px-2 py-2.5 text-center">
              <p className="text-[9px] text-berry-200/70 uppercase tracking-wide leading-tight">{stat.label}</p>
              <p className="font-display text-lg font-bold tabular-nums mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
        {onUpdateUsername && (
          <div className="relative mt-3 text-xs text-berry-200/80 min-w-0">
              <div className="mt-1">
                {editingUsername ? (
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] text-berry-200/60 uppercase tracking-wide block">
                      Nombre en la tabla
                    </label>
                    <input
                      type="text"
                      value={usernameDraft}
                      onChange={(e) => setUsernameDraft(e.target.value)}
                      maxLength={24}
                      placeholder="Tu nombre público"
                      className="w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1.5 text-xs text-white placeholder:text-stone-500 focus:border-berry-400 focus:outline-none"
                      disabled={savingUsername}
                    />
                    {usernameError && <p className="text-[10px] text-red-300">{usernameError}</p>}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUsername(false)
                          setUsernameError('')
                          setUsernameDraft(displayAlias ?? '')
                        }}
                        className="text-[10px] text-stone-400"
                        disabled={savingUsername}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={saveUsername}
                        disabled={savingUsername || !usernameDraft.trim()}
                        className="text-[10px] font-semibold text-berry-300 disabled:opacity-50"
                      >
                        {savingUsername ? 'Guardando…' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingUsername(true)}
                    className="text-[10px] text-berry-200/60 hover:text-berry-200 text-right w-full"
                  >
                    Tabla: <span className="text-white font-medium">{displayAlias ?? 'Sin nombre'}</span>
                    <span className="ml-1 text-berry-300">· Editar</span>
                  </button>
                )}
              </div>
          </div>
        )}
      </div>

      {/* Countdown Mundial */}
      <div
        className={`rounded-2xl border p-4 overflow-hidden relative ${
          isDark
            ? 'border-white/10 bg-gradient-to-r from-stone-900 to-stone-950'
            : 'border-stone-200 bg-gradient-to-r from-white to-stone-50 shadow-sm'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-berry-600/10 via-transparent to-transparent" />
        <div className="relative flex items-center gap-4">
          <TeamCrest src={worldCup.competition.emblem} alt="Mundial" size={52} />
          <div className="flex-1">
            <h2 className="font-display font-bold text-base">Mundial FIFA 2026</h2>
            <p className={`text-xs mt-0.5 ${theme.muted}`}>
              {worldCup.stats.totalTeams} selecciones · {worldCup.stats.totalMatches} partidos
            </p>
          </div>
          <div className="text-center shrink-0 bg-berry-600/20 border border-berry-500/30 rounded-xl px-3 py-2">
            <p className="font-display text-2xl font-bold text-berry-300 tabular-nums">{daysToStart}</p>
            <p className="text-[9px] text-stone-500 uppercase">días</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Inicio', value: new Date(worldCup.competition.startDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) },
            { label: 'Final', value: new Date(worldCup.competition.endDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) },
            { label: 'Sedes', value: '🇺🇸🇲🇽🇨🇦' },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-lg border py-2 text-center ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <p className={`text-xs font-semibold ${theme.resultText}`}>{item.value}</p>
              <p className={`text-[9px] uppercase mt-0.5 ${theme.mutedSm}`}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Colombia */}
      {worldCup.colombiaQualified && colombiaTeam && (
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-950/40 via-berry-950/40 to-stone-950 p-4">
          <div className="flex items-center gap-3 mb-3">
            <TeamCrest src={colombiaTeam.crest} alt="Colombia" size={44} />
            <div>
              <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">🇨🇴 La Tricolor</p>
              <p className="font-semibold">Colombia en el Mundial</p>
              {colombiaTeam.coach && <p className="text-[10px] text-stone-500">DT: {colombiaTeam.coach}</p>}
            </div>
          </div>
          {worldCup.colombiaNextMatch && (
            <div className="rounded-xl bg-black/30 px-3 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamCrest src={worldCup.colombiaNextMatch.homeTeam.crest} alt="" size={24} />
                <span className="text-xs font-medium truncate">
                  {teamLabel(worldCup.colombiaNextMatch.homeTeam)} vs {teamLabel(worldCup.colombiaNextMatch.awayTeam)}
                </span>
                <TeamCrest src={worldCup.colombiaNextMatch.awayTeam.crest} alt="" size={24} />
              </div>
              <span className="text-[10px] text-berry-400 shrink-0">{worldCup.colombiaNextMatch.startsIn}</span>
            </div>
          )}
        </div>
      )}

      {/* Tabla en vivo */}
      <PollaLeaderboard entries={leaderboard} isDark={isDark} />

      <PollaReglamento compact isDark={isDark} />

      {/* Próximos partidos */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Próximos partidos</h3>
          <button type="button" onClick={onGoJugar} className="text-xs text-berry-400 font-medium">
            Pronosticar →
          </button>
        </div>
        <div className="space-y-2">
          {upcoming.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${theme.cardSoft}`}
            >
              <TeamCrest src={m.homeTeam.crest} alt="" size={28} />
              <div className="flex-1 min-w-0 text-center">
                <p className="text-xs font-medium truncate">
                  {teamLabel(m.homeTeam)} <span className={theme.mutedSm}>vs</span> {teamLabel(m.awayTeam)}
                </p>
                <p className={`text-[10px] ${theme.mutedSm}`}>{m.formattedDate}</p>
              </div>
              <TeamCrest src={m.awayTeam.crest} alt="" size={28} />
              <span className="text-[10px] text-berry-400 font-medium w-12 text-right shrink-0">{m.startsIn}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { Icon: IconGroups, label: 'Grupos', value: `${worldCup.groups.length}`, sub: 'de 4 equipos' },
          { Icon: IconTrophy, label: 'Fases', value: `${worldCup.knockoutRounds.length}`, sub: 'eliminatorias' },
          { Icon: IconTarget, label: 'Costo por pick', value: predictionCost.toLocaleString('es-CO'), sub: 'créditos' },
          { Icon: IconBall, label: 'Partidos', value: `${worldCup.stats.totalMatches}`, sub: 'en el torneo' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 ${theme.cardSoft}`}>
            <s.Icon className="w-5 h-5 text-berry-400" />
            <p className="font-display text-lg font-bold text-berry-500 mt-2">{s.value}</p>
            <p className={`text-[10px] ${theme.mutedSm}`}>{s.label} · {s.sub}</p>
          </div>
        ))}
      </div>

      {/* Formato */}
      <div className={`rounded-2xl border p-4 ${theme.cardSoft}`}>
        <h3 className="font-semibold text-sm mb-3">Formato del torneo</h3>
        <div className="space-y-2">
          {MUNDIAL_2026.format.map((line, i) => (
            <div key={line} className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-berry-600/30 text-berry-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
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
            <h3 className="font-semibold text-sm">Tus últimos picks</h3>
            <button type="button" onClick={onGoPicks} className="text-xs text-berry-400">Ver todos →</button>
          </div>
          <div className="space-y-2">
            {predictions.slice(-3).reverse().map((p) => (
              <div
                key={p.id}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  isDark
                    ? 'bg-berry-950/30 border-berry-500/20'
                    : 'bg-berry-50 border-berry-200'
                }`}
              >
                <span className={theme.body}>{p.homeTeamName}</span>{' '}
                <strong className="text-berry-500 text-sm">{p.homeScore}-{p.awayScore}</strong>{' '}
                <span className={theme.body}>{p.awayTeamName}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-2 pt-1">
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
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-berry-600 hover:bg-berry-500 text-sm font-semibold text-white shadow-lg shadow-berry-900/30 transition-colors"
        >
          <IconTarget className="w-4 h-4" />
          Jugar ahora
        </button>
      </div>
    </div>
  )
}
