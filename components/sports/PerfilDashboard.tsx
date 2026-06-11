'use client'

import MundialExplorer from '@/components/sports/MundialExplorer'
import PerfilInicio from '@/components/sports/PerfilInicio'
import PredictionCard from '@/components/sports/PredictionCard'
import { IconClipboard, IconGlobe, IconHome, IconTarget } from '@/components/sports/SportsIcons'
import TeamCrest from '@/components/sports/TeamCrest'
import type { ScoringRules } from '@/lib/polla-rules'
import type { LeaderboardEntry, MatchPrediction, SportsUser } from '@/lib/sports-polla-shared'
import type { WorldCupFullData } from '@/lib/football-data'
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
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-berry-400/30 border-t-berry-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'No se pudo cargar el perfil'}</p>
          <button type="button" onClick={loadProfile} className="text-berry-400 font-semibold">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const { worldCup, matches, predictionCost } = data
  const credits = data.user.credits

  const groupFilters = ['all', ...new Set(matches.map((m) => m.group).filter(Boolean))] as string[]
  const filteredMatches =
    matchFilter === 'all' ? matches : matches.filter((m) => m.group === matchFilter)

  return (
    <div className="min-h-screen bg-stone-950 text-white pb-[4.5rem]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-stone-950/95 backdrop-blur-xl safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/sports" className="text-xs text-berry-400 font-medium">
              ← Polla
            </Link>
            <Link href="/sports/reglamento" className="text-[10px] text-stone-500 hover:text-berry-400">
              Reglamento
            </Link>
          </div>
          <span className="font-display font-bold text-sm truncate">Mi perfil</span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/sports' })}
            className="text-xs text-stone-500 shrink-0"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {tab === 'inicio' && (
          <PerfilInicio
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
          />
        )}

        {tab === 'mundial' && <MundialExplorer data={worldCup} />}

        {tab === 'jugar' && (
          <div className="space-y-3">
            <p className="text-xs text-stone-500">
              Pronostica antes del pitazo · {predictionCost} créditos c/u
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setMatchFilter('all')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  matchFilter === 'all' ? 'bg-berry-600 text-white' : 'bg-white/5 text-stone-400'
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
                    matchFilter === g ? 'bg-berry-600 text-white' : 'bg-white/5 text-stone-400'
                  }`}
                >
                  {g.replace('GROUP_', '')}
                </button>
              ))}
            </div>
            {filteredMatches.map((match) => (
              <div key={match.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  {match.groupLabel && (
                    <span className="text-[10px] text-stone-500 bg-stone-900 px-2 py-0.5 rounded-full">
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
                      <p className="text-[10px] text-stone-500">{match.formattedDate}</p>
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
              <div className="text-center py-12 text-stone-500 text-sm">
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
                <p className="text-[10px] text-stone-500 text-center pb-1">
                  Puntos: +{data.scoringRules.exactScore} exacto · +{data.scoringRules.goalDifference} dif. · +{data.scoringRules.correctResult} resultado
                </p>
                {data.predictions.map((p) => (
                  <PredictionCard key={p.id} prediction={p} />
                ))}
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom nav móvil */}
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-stone-950/95 backdrop-blur-xl safe-area-bottom">
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
          <div className="w-full max-w-lg rounded-t-2xl border border-white/10 bg-stone-900 p-5 pb-8 shadow-2xl">
            <div className="w-10 h-1 bg-stone-700 rounded-full mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold text-center mb-1">Tu pronóstico</h3>
            <p className="text-stone-500 text-xs text-center mb-5">
              {activeMatch.homeTeam.name} vs {activeMatch.awayTeam.name}
            </p>
            <div className="flex items-center justify-center gap-6 mb-5">
              <div className="text-center">
                <TeamCrest src={activeMatch.homeTeam.crest} alt="" size={36} className="mx-auto mb-2" />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  value={homeScore}
                  onChange={(e) => setHomeScore(Math.max(0, Math.min(20, Number(e.target.value))))}
                  className="w-14 h-12 text-center text-xl font-bold rounded-xl bg-stone-800 border border-white/10 text-white focus:ring-2 focus:ring-berry-500 focus:outline-none"
                />
              </div>
              <span className="text-stone-600 font-bold text-2xl">:</span>
              <div className="text-center">
                <TeamCrest src={activeMatch.awayTeam.crest} alt="" size={36} className="mx-auto mb-2" />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  value={awayScore}
                  onChange={(e) => setAwayScore(Math.max(0, Math.min(20, Number(e.target.value))))}
                  className="w-14 h-12 text-center text-xl font-bold rounded-xl bg-stone-800 border border-white/10 text-white focus:ring-2 focus:ring-berry-500 focus:outline-none"
                />
              </div>
            </div>
            {!activeMatch.prediction && (
              <p className="text-center text-[10px] text-stone-500 mb-3">
                Costo: {predictionCost} créditos · Saldo: {credits - predictionCost}
              </p>
            )}
            {formError && <p className="text-red-400 text-xs text-center mb-3">{formError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveMatch(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-stone-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitPrediction}
                disabled={saving || (!activeMatch.prediction && credits < predictionCost)}
                className="flex-1 py-3 rounded-xl bg-berry-600 disabled:opacity-50 text-white font-semibold"
              >
                {saving ? 'Guardando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
