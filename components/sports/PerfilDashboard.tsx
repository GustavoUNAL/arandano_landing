'use client'

import MundialExplorer from '@/components/sports/MundialExplorer'
import MundialThemeToggle from '@/components/sports/MundialThemeToggle'
import PerfilInicio from '@/components/sports/PerfilInicio'
import PredictionCard from '@/components/sports/PredictionCard'
import { IconClipboard, IconGlobe, IconHome, IconTarget } from '@/components/sports/SportsIcons'
import TeamCrest from '@/components/sports/TeamCrest'
import { useMundialTheme } from '@/hooks/useMundialTheme'
import type { ScoringRules } from '@/lib/polla-rules'
import type { LeaderboardEntry, MatchPrediction, SportsUser } from '@/lib/sports-polla-shared'
import type { WorldCupFullData } from '@/lib/football-data'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface MatchWithPrediction {
  id: number
  utcDate: string
  status: string
  stage: string
  group: string | null
  groupLabel: string | null
  stageLabel: string
  homeTeam: { name: string; shortName: string; tla: string; crest: string }
  awayTeam: { name: string; shortName: string; tla: string; crest: string }
  startsIn: string
  formattedDate: string
  prediction: MatchPrediction | null
  canPredict: boolean
}

interface ProfileData {
  user: SportsUser
  worldCup: WorldCupFullData
  matches: MatchWithPrediction[]
  predictions: MatchPrediction[]
  leaderboard: LeaderboardEntry[]
  predictionCost: number
  scoringRules: ScoringRules
}

type MainTab = 'inicio' | 'mundial' | 'jugar' | 'picks'

const MAIN_TABS: { id: MainTab; label: string; Icon: typeof IconHome }[] = [
  { id: 'inicio', label: 'Inicio', Icon: IconHome },
  { id: 'mundial', label: 'Mundial', Icon: IconGlobe },
  { id: 'jugar', label: 'Jugar', Icon: IconTarget },
  { id: 'picks', label: 'Mis picks', Icon: IconClipboard },
]

export default function PerfilDashboard() {
  const { data: session } = useSession()
  const { isDark, toggleTheme } = useMundialTheme()
  const theme = mundialTheme(isDark)
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<MainTab>('inicio')
  const [saving, setSaving] = useState(false)
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [formError, setFormError] = useState('')
  const [matchFilter, setMatchFilter] = useState('all')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sports/me')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al cargar perfil')
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (tab !== 'inicio' && tab !== 'picks') return
    const interval = setInterval(loadProfile, 60_000)
    return () => clearInterval(interval)
  }, [tab, loadProfile])

  const openPredict = (match: MatchWithPrediction) => {
    setActiveMatch(match)
    setHomeScore(match.prediction?.homeScore ?? 0)
    setAwayScore(match.prediction?.awayScore ?? 0)
    setFormError('')
  }

  const updateUsername = async (displayAlias: string) => {
    const res = await fetch('/api/sports/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayAlias }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Error al guardar nombre')
    setData((prev) => (prev ? { ...prev, user: json.user } : prev))
  }

  const submitPrediction = async () => {
    if (!activeMatch || !data) return
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch('/api/sports/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: activeMatch.id,
          homeScore,
          awayScore,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar')
      setActiveMatch(null)
      await loadProfile()
      setTab('picks')
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const user = session?.user

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.page}`}>
        <div className="w-10 h-10 border-4 border-berry-400/30 border-t-berry-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${theme.page}`}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'No se pudo cargar el perfil'}</p>
          <button type="button" onClick={loadProfile} className="text-berry-400 font-semibold">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const { worldCup, matches, predictionCost, scoringRules } = data
  const credits = data.user.credits
  const maxScore = scoringRules.maxScorePerTeam

  const groupFilters = ['all', ...new Set(matches.map((m) => m.group).filter(Boolean))] as string[]
  const filteredMatches =
    matchFilter === 'all' ? matches : matches.filter((m) => m.group === matchFilter)

  return (
    <div className={`min-h-screen pb-[4.5rem] transition-colors duration-300 ${theme.page}`}>
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl safe-area-top transition-colors ${theme.header}`}
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/mundial" className="text-xs text-berry-400 font-medium">
              ← Polla
            </Link>
            <Link
              href="/mundial/reglamento"
              className={`text-[10px] hover:text-berry-400 ${theme.mutedSm}`}
            >
              Reglamento
            </Link>
          </div>
          <span className="font-display font-bold text-sm truncate">Mi perfil</span>
          <div className="flex items-center gap-2 shrink-0">
            <MundialThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/mundial' })}
              className={`text-xs ${theme.mutedSm}`}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {tab === 'inicio' && (
          <PerfilInicio
            isDark={isDark}
            userName={user?.name}
            userEmail={user?.email}
            userImage={user?.image}
            displayAlias={data.user.displayAlias}
            totalPoints={data.user.totalPoints}
            credits={credits}
            predictionCost={predictionCost}
            scoringRules={data.scoringRules}
            predictions={data.predictions}
            leaderboard={data.leaderboard}
            worldCup={worldCup}
            onGoMundial={() => setTab('mundial')}
            onGoJugar={() => setTab('jugar')}
            onGoPicks={() => setTab('picks')}
            onUpdateUsername={updateUsername}
          />
        )}

        {tab === 'mundial' && <MundialExplorer data={worldCup} isDark={isDark} />}

        {tab === 'jugar' && (
          <div className="space-y-3">
            <p className={`text-xs ${theme.mutedSm}`}>
              Pronostica antes del pitazo · {predictionCost} créditos por pick nuevo · editar es gratis
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setMatchFilter('all')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  matchFilter === 'all'
                    ? 'bg-berry-600 text-white'
                    : isDark
                      ? 'bg-white/5 text-stone-400'
                      : 'bg-stone-100 text-stone-600'
                }`}
              >
                Todos
              </button>
              {groupFilters.filter((g) => g !== 'all').map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setMatchFilter(g)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    matchFilter === g
                      ? 'bg-berry-600 text-white'
                      : isDark
                        ? 'bg-white/5 text-stone-400'
                        : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {g.replace('GROUP_', '')}
                </button>
              ))}
            </div>
            {filteredMatches.map((match) => (
              <div key={match.id} className={`rounded-xl border p-3 ${theme.cardSoft}`}>
                <div className="flex items-center gap-2 mb-2">
                  {match.groupLabel && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${theme.mutedSm} ${
                        isDark ? 'bg-stone-900' : 'bg-stone-100'
                      }`}
                    >
                      {match.groupLabel}
                    </span>
                  )}
                  <span className="text-[10px] text-berry-400 ml-auto">{match.startsIn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TeamCrest src={match.homeTeam.crest} alt="" size={32} />
                  <div className="flex-1 text-center min-w-0">
                    <p className="text-xs font-medium truncate">
                      {match.homeTeam.tla} vs {match.awayTeam.tla}
                    </p>
                    {match.prediction ? (
                      <p className="text-lg font-bold text-berry-300 tabular-nums">
                        {match.prediction.homeScore} - {match.prediction.awayScore}
                      </p>
                    ) : (
                      <p className={`text-[10px] ${theme.mutedSm}`}>{match.formattedDate}</p>
                    )}
                  </div>
                  <TeamCrest src={match.awayTeam.crest} alt="" size={32} />
                </div>
                {match.canPredict && (
                  <button
                    type="button"
                    onClick={() => openPredict(match)}
                    className="w-full mt-3 py-2 rounded-lg bg-berry-600 hover:bg-berry-500 text-white text-sm font-semibold"
                  >
                    {match.prediction ? 'Editar' : 'Pronosticar'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'picks' && (
          <div className="space-y-3">
            {data.predictions.length === 0 ? (
              <div className={`text-center py-12 text-sm ${theme.muted}`}>
                <IconTarget className="w-10 h-10 mx-auto mb-3 text-stone-600" />
                Aún no tienes pronósticos
                <button
                  type="button"
                  onClick={() => setTab('jugar')}
                  className="block mx-auto mt-4 text-berry-400 font-semibold"
                >
                  Ir a jugar →
                </button>
              </div>
            ) : (
              <>
                <p className={`text-[10px] text-center pb-1 ${theme.mutedSm}`}>
                  Puntos: +{data.scoringRules.exactScore} exacto · +{data.scoringRules.goalDifference} dif. · +{data.scoringRules.correctResult} resultado
                </p>
                {data.predictions.map((p) => (
                  <PredictionCard key={p.id} prediction={p} isDark={isDark} />
                ))}
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom nav móvil */}
      <nav
        className={`fixed bottom-0 inset-x-0 z-50 border-t backdrop-blur-xl safe-area-bottom transition-colors ${theme.header}`}
      >
        <div className="max-w-lg mx-auto flex">
          {MAIN_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                tab === t.id ? 'text-berry-400' : 'text-stone-500'
              }`}
            >
              <t.Icon className="w-5 h-5" />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {activeMatch && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-t-2xl border p-5 pb-8 shadow-2xl ${theme.card}`}>
            <div
              className={`w-10 h-1 rounded-full mx-auto mb-4 ${isDark ? 'bg-stone-700' : 'bg-stone-300'}`}
            />
            <h3 className="font-display text-lg font-bold text-center mb-1">Tu pronóstico</h3>
            <p className={`text-xs text-center mb-5 ${theme.mutedSm}`}>
              {activeMatch.homeTeam.name} vs {activeMatch.awayTeam.name}
            </p>
            <div className="flex items-center justify-center gap-6 mb-5">
              <div className="text-center">
                <TeamCrest src={activeMatch.homeTeam.crest} alt="" size={36} className="mx-auto mb-2" />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={maxScore}
                  value={homeScore}
                  onChange={(e) =>
                    setHomeScore(Math.max(0, Math.min(maxScore, Number(e.target.value))))
                  }
                  className={`w-14 h-12 text-center text-xl font-bold rounded-xl border focus:ring-2 focus:ring-berry-500 focus:outline-none ${
                    isDark
                      ? 'bg-stone-800 border-white/10 text-white'
                      : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>
              <span className={`font-bold text-2xl ${theme.arrow}`}>:</span>
              <div className="text-center">
                <TeamCrest src={activeMatch.awayTeam.crest} alt="" size={36} className="mx-auto mb-2" />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={maxScore}
                  value={awayScore}
                  onChange={(e) =>
                    setAwayScore(Math.max(0, Math.min(maxScore, Number(e.target.value))))
                  }
                  className={`w-14 h-12 text-center text-xl font-bold rounded-xl border focus:ring-2 focus:ring-berry-500 focus:outline-none ${
                    isDark
                      ? 'bg-stone-800 border-white/10 text-white'
                      : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>
            </div>
            {activeMatch.prediction ? (
              <p className="text-center text-[10px] text-emerald-400/90 mb-3">
                Editar antes del pitazo no consume créditos adicionales
              </p>
            ) : (
              <p className={`text-center text-[10px] mb-3 ${theme.mutedSm}`}>
                Costo: {predictionCost} créditos · Saldo tras guardar:{' '}
                {(credits - predictionCost).toLocaleString('es-CO')}
              </p>
            )}
            {formError && <p className="text-red-400 text-xs text-center mb-3">{formError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveMatch(null)}
                className={`flex-1 py-3 rounded-xl border ${theme.btnOutline}`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitPrediction}
                disabled={saving || (!activeMatch.prediction && credits < predictionCost)}
                className="flex-1 py-3 rounded-xl bg-berry-600 disabled:opacity-50 text-white font-semibold"
              >
                {saving ? 'Guardando…' : activeMatch.prediction ? 'Guardar cambios' : 'Confirmar pick'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
