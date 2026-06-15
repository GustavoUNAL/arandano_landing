'use client'

import CafePromoBanner from '@/components/sports/CafePromoBanner'
import LiveMatchBroadcast from '@/components/sports/LiveMatchBroadcast'
import MatchLivePanel from '@/components/sports/MatchLivePanel'
import MundialExplorer from '@/components/sports/MundialExplorer'
import MundialThemeToggle from '@/components/sports/MundialThemeToggle'
import AriPredictorPanel from '@/components/ari/AriPredictorPanel'
import PerfilInicio from '@/components/sports/PerfilInicio'
import PollaAdminPanel from '@/components/sports/PollaAdminPanel'
import PollaNotificationCenter from '@/components/sports/PollaNotificationCenter'
import PredictionCard from '@/components/sports/PredictionCard'
import {
  IconClipboard,
  IconGlobe,
  IconHome,
  IconShield,
  IconSparkle,
  IconTarget,
} from '@/components/sports/SportsIcons'
import TeamCrest from '@/components/sports/TeamCrest'
import UserAvatar from '@/components/sports/UserAvatar'
import { useMundialTheme } from '@/hooks/useMundialTheme'
import { useLiveSportsStream } from '@/hooks/useLiveSportsStream'
import type { ProfileStreamPayload } from '@/lib/live-broadcast-types'
import type { ScoringRules } from '@/lib/polla-rules'
import type { LeaderboardEntry, MatchPrediction, SportsUser } from '@/lib/sports-polla-shared'
import type { WorldCupFullData } from '@/lib/football-data'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { isPerfilTab, perfilPathForPlayMatch, perfilPathForTab, type PerfilTab } from '@/lib/perfil-routes'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
  statusLabel: string
  isLive: boolean
  isFinished: boolean
  displayScore: { home: number | null; away: number | null }
  prediction: MatchPrediction | null
  canPredict: boolean
  canViewHub: boolean
}

interface ProfileData {
  user: SportsUser
  isPollAdmin: boolean
  worldCup: WorldCupFullData
  matches: MatchWithPrediction[]
  watchMatches: MatchWithPrediction[]
  broadcastMatchIds: number[]
  hasLiveMatches: boolean
  predictions: MatchPrediction[]
  leaderboard: LeaderboardEntry[]
  leaderboardKnockout: LeaderboardEntry[]
  predictionCost: number
  scoringRules: ScoringRules
}

type MainTab = PerfilTab
type ScoreField = number | ''

function parseScoreInput(raw: string, max: number): ScoreField {
  if (raw === '') return ''
  const n = Number(raw)
  if (Number.isNaN(n)) return ''
  return Math.max(0, Math.min(max, Math.trunc(n)))
}

const BASE_TABS: { id: MainTab; label: string; Icon: typeof IconHome }[] = [
  { id: 'inicio', label: 'Inicio', Icon: IconHome },
  { id: 'mundial', label: 'Mundial', Icon: IconGlobe },
  { id: 'jugar', label: 'Jugar', Icon: IconTarget },
  { id: 'picks', label: 'Mis picks', Icon: IconClipboard },
  { id: 'ari', label: 'Predictor', Icon: IconSparkle },
]

const ADMIN_TAB = { id: 'admin' as const, label: 'Admin', Icon: IconShield }

export default function PerfilDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isDark, toggleTheme } = useMundialTheme()
  const theme = mundialTheme(isDark)
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<MainTab>(() => {
    const fromUrl = searchParams.get('tab')
    return isPerfilTab(fromUrl) ? fromUrl : 'inicio'
  })
  const [saving, setSaving] = useState(false)
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null)
  const [homeScore, setHomeScore] = useState<ScoreField>('')
  const [awayScore, setAwayScore] = useState<ScoreField>('')
  const [formError, setFormError] = useState('')
  const [matchFilter, setMatchFilter] = useState('all')
  const [matchPhase, setMatchPhase] = useState<'all' | 'live' | 'upcoming' | 'played'>('all')
  const [liveMatchId, setLiveMatchId] = useState<number | null>(null)

  const loadProfile = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true)
    }
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

  const changeTab = useCallback(
    (newTab: MainTab) => {
      setTab(newTab)
      router.replace(perfilPathForTab(newTab), { scroll: false })
    },
    [router]
  )

  useEffect(() => {
    const fromUrl = searchParams.get('tab')
    if (isPerfilTab(fromUrl) && fromUrl !== tab) {
      setTab(fromUrl)
    }
  }, [searchParams, tab])

  useEffect(() => {
    if (tab === 'admin' && data && !data.isPollAdmin) {
      changeTab('inicio')
    }
  }, [tab, data, changeTab])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const { data: profileStream } = useLiveSportsStream<ProfileStreamPayload>({
    channel: 'profile',
    enabled: Boolean(data),
  })

  useEffect(() => {
    if (!profileStream?.profile) return
    setData(profileStream.profile as ProfileData)
  }, [profileStream])

  const openPredict = useCallback((match: MatchWithPrediction) => {
    setActiveMatch(match)
    setHomeScore(match.prediction?.homeScore ?? '')
    setAwayScore(match.prediction?.awayScore ?? '')
    setFormError('')
  }, [])

  const goPlayMatch = useCallback(
    (matchId: number) => {
      setTab('jugar')
      router.replace(perfilPathForPlayMatch(matchId), { scroll: false })
    },
    [router]
  )

  useEffect(() => {
    const raw = searchParams.get('match')
    if (!raw || !data) return
    const matchId = Number(raw)
    if (!Number.isFinite(matchId)) return

    const match =
      data.matches.find((m) => m.id === matchId) ??
      data.watchMatches.find((m) => m.id === matchId)

    if (!match) return

    if (match.canPredict) {
      openPredict(match)
    } else if (match.canViewHub || match.isLive) {
      setLiveMatchId(matchId)
    }
  }, [searchParams, data, openPredict])

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
    if (homeScore === '' || awayScore === '') {
      setFormError('Ingresa el marcador de ambos equipos')
      return
    }
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
      await loadProfile({ silent: true })
      changeTab('picks')
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const user = session?.user

  const notificationMatches = useMemo(() => {
    if (!data) return []
    const watch = data.watchMatches ?? []
    return [...new Map([...data.matches, ...watch].map((m) => [m.id, m] as const)).values()]
  }, [data])

  if (loading && !data) {
    return (
      <div className={`min-h-screen lg:flex ${theme.page}`}>
        <aside
          className={`hidden lg:flex lg:flex-col lg:w-72 xl:w-80 lg:shrink-0 lg:border-r lg:sticky lg:top-0 lg:h-screen ${
            isDark ? 'bg-stone-950/95' : 'bg-white'
          } ${theme.border}`}
        >
          <div className="p-6 space-y-4 animate-pulse">
            <div className={`h-20 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-stone-100'}`} />
            <div className={`h-10 rounded-xl ${isDark ? 'bg-white/5' : 'bg-stone-100'}`} />
            <div className={`h-10 rounded-xl ${isDark ? 'bg-white/5' : 'bg-stone-100'}`} />
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
          <header className={`hidden lg:flex border-b px-8 py-5 ${theme.header} ${theme.border}`}>
            <div className={`h-8 w-48 rounded-lg animate-pulse ${isDark ? 'bg-white/5' : 'bg-stone-100'}`} />
          </header>
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-berry-400/30 border-t-berry-400 rounded-full animate-spin mx-auto" />
              <p className={`mt-4 text-sm ${theme.mutedSm}`}>Cargando tu perfil…</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${theme.page}`}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'No se pudo cargar el perfil'}</p>
          <button type="button" onClick={() => loadProfile()} className="text-berry-400 font-semibold">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const { worldCup, matches, predictionCost, scoringRules } = data
  const credits = data.user.credits
  const maxScore = scoringRules.maxScorePerTeam

  const watchMatches = data.watchMatches ?? []
  const allPlayMatches = [
    ...new Map(
      [...watchMatches, ...matches].map((m) => [m.id, m] as const)
    ).values(),
  ].sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())

  const groupFilters = ['all', ...new Set(allPlayMatches.map((m) => m.group).filter(Boolean))] as string[]

  const phaseFiltered = allPlayMatches.filter((m) => {
    if (matchPhase === 'live') return m.isLive
    if (matchPhase === 'upcoming') return m.canPredict
    if (matchPhase === 'played') return m.isFinished || m.canViewHub
    return m.canPredict || m.canViewHub
  })

  const filteredMatches =
    matchFilter === 'all' ? phaseFiltered : phaseFiltered.filter((m) => m.group === matchFilter)

  const mainTabs = data.isPollAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS
  const tabLabel = mainTabs.find((t) => t.id === tab)?.label ?? 'Mi perfil'
  const liveMatchIds = data.broadcastMatchIds ?? []

  return (
    <div className={`min-h-screen pb-[4.5rem] lg:pb-0 transition-colors duration-300 lg:flex ${theme.page}`}>
      {/* Sidebar desktop */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:w-72 xl:w-80 lg:shrink-0 lg:border-r lg:sticky lg:top-0 lg:h-screen ${
          isDark ? 'bg-stone-950/95' : 'bg-white'
        } ${theme.border}`}
      >
        <div className={`p-6 border-b ${theme.border}`}>
          <div
            className={`rounded-2xl border p-4 ${
              isDark ? 'bg-white/[0.04] border-white/10' : 'bg-berry-50/80 border-berry-100'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar
                src={user?.image}
                name={user?.name}
                size={48}
                className={isDark ? 'border-white/20' : 'border-berry-200'}
              />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold truncate ${theme.sidebarUserName}`}>
                  {user?.name ?? 'Jugador'}
                </p>
                <p className={`text-[11px] truncate mt-0.5 ${theme.sidebarUserMeta}`}>
                  Tabla: {data.user.displayAlias ?? 'Sin nombre'}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div
                className={`rounded-xl px-2.5 py-2 text-center ${
                  isDark ? 'bg-black/25 border border-white/10' : 'bg-white border border-berry-100'
                }`}
              >
                <p className={`text-[9px] uppercase tracking-wide ${theme.mutedSm}`}>Créditos</p>
                <p className={`text-sm font-bold tabular-nums ${theme.accent}`}>
                  {credits.toLocaleString('es-CO')}
                </p>
              </div>
              <div
                className={`rounded-xl px-2.5 py-2 text-center ${
                  isDark ? 'bg-black/25 border border-white/10' : 'bg-white border border-berry-100'
                }`}
              >
                <p className={`text-[9px] uppercase tracking-wide ${theme.mutedSm}`}>Puntos</p>
                <p className={`text-sm font-bold tabular-nums ${theme.accent}`}>
                  {data.user.totalPoints.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {mainTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => changeTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                tab === t.id ? theme.navActive : theme.navInactive
              }`}
            >
              <t.Icon className="w-5 h-5 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>
        <div className={`px-4 pt-4 pb-4 border-t ${theme.border}`}>
          <Link
            href="/mundial/reglamento"
            className={`mt-3 flex items-center justify-center w-full py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
              isDark
                ? 'border-white/15 text-stone-300 hover:bg-white/5'
                : 'border-stone-300 text-stone-600 hover:bg-stone-50'
            }`}
          >
            Ver reglamento →
          </Link>
        </div>
        <div className={`p-4 border-t flex items-center justify-between gap-2 ${theme.border}`}>
          <MundialThemeToggle isDark={isDark} onToggle={toggleTheme} />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/mundial' })}
            className={`text-xs font-medium ${theme.mutedSm} hover:text-berry-500`}
          >
            Salir
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 min-h-0 ${tab === 'ari' ? 'overflow-hidden' : ''}`}>
        {/* Header móvil */}
        <header
          className={`lg:hidden sticky top-0 z-40 border-b backdrop-blur-xl safe-area-top transition-colors overflow-visible ${theme.header}`}
        >
          <div className="max-w-lg mx-auto px-3 py-2.5 flex items-center gap-2 overflow-visible">
            <div className="flex-1 min-w-0">
              <p className={`font-display font-bold text-sm truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>
                {data.hasLiveMatches ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    En vivo
                  </span>
                ) : (
                  tabLabel
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0 overflow-visible">
              <MundialThemeToggle isDark={isDark} onToggle={toggleTheme} />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/mundial' })}
                className={`text-[11px] px-2 py-1 ${theme.mutedSm}`}
              >
                Salir
              </button>
              <PollaNotificationCenter
                matches={notificationMatches}
                predictions={data.predictions}
                isDark={isDark}
                onPlayMatch={goPlayMatch}
                panelAlign="right"
                panelPlacement="below"
                size="comfortable"
              />
            </div>
          </div>
        </header>

        {/* Header desktop */}
        <header
          className={`hidden lg:flex sticky top-0 z-30 border-b backdrop-blur-xl transition-colors overflow-visible ${theme.header}`}
        >
          <div className="w-full max-w-7xl mx-auto px-8 xl:px-10 py-5 flex items-center justify-between gap-6 overflow-visible">
            <div>
              <h1 className={`font-display text-2xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                {tabLabel}
              </h1>
              <p className={`text-sm mt-0.5 ${theme.muted}`}>
                {tab === 'jugar'
                  ? 'Elige un partido y guarda tu marcador antes del pitazo'
                  : tab === 'picks'
                    ? `${data.predictions.length} pronóstico${data.predictions.length === 1 ? '' : 's'} registrados`
                    : tab === 'ari'
                      ? 'Tu compañero para la polla del Mundial'
                      : tab === 'admin'
                      ? 'Gestión de pasaportes y jugadores registrados'
                      : 'Polla Mundialista FIFA 2026'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 overflow-visible">
              {tab !== 'jugar' && (
                <button
                  type="button"
                  onClick={() => changeTab('jugar')}
                  className="px-4 py-2 rounded-xl bg-berry-600 hover:bg-berry-500 text-white text-sm font-semibold transition-colors"
                >
                  Pronosticar
                </button>
              )}
              <Link
                href="/mundial"
                className={`text-sm font-medium px-3 py-2 rounded-lg ${theme.accentLink}`}
              >
                Ver landing
              </Link>
              <PollaNotificationCenter
                matches={notificationMatches}
                predictions={data.predictions}
                isDark={isDark}
                onPlayMatch={goPlayMatch}
                panelAlign="right"
                panelPlacement="below"
                size="comfortable"
              />
            </div>
          </div>
        </header>

        <main
          className={`flex-1 w-full max-w-lg lg:max-w-7xl mx-auto lg:px-8 xl:px-10 lg:py-8 flex flex-col min-h-0 ${
            tab === 'ari' ? 'px-3 py-2 overflow-hidden' : 'px-4 py-4'
          }`}
        >
        {tab !== 'ari' && (
          <CafePromoBanner isDark={isDark} compact className="mb-4 lg:mb-6" />
        )}

        {data.hasLiveMatches && liveMatchIds.length > 0 && tab !== 'inicio' && (
          <LiveMatchBroadcast
            matchIds={liveMatchIds}
            userPredictions={data.predictions}
            isDark={isDark}
            variant="inicio"
            onOpenDetail={setLiveMatchId}
            className="mb-5 lg:mb-8"
          />
        )}

        {tab === 'inicio' && (
          <PerfilInicio
            isDark={isDark}
            userName={user?.name}
            userEmail={user?.email}
            userImage={user?.image}
            displayAlias={data.user.displayAlias}
            hasKnockoutPassport={data.user.hasKnockoutPassport}
            totalPoints={data.user.totalPoints}
            credits={credits}
            predictionCost={predictionCost}
            scoringRules={data.scoringRules}
            predictions={data.predictions}
            leaderboard={data.leaderboard}
            leaderboardKnockout={data.leaderboardKnockout}
            worldCup={worldCup}
            onGoMundial={() => changeTab('mundial')}
            onGoJugar={() => changeTab('jugar')}
            onGoPicks={() => changeTab('picks')}
            onPlayMatch={goPlayMatch}
            onUpdateUsername={updateUsername}
          />
        )}

        {tab === 'mundial' && <MundialExplorer data={worldCup} isDark={isDark} />}

        {tab === 'ari' && (
          <AriPredictorPanel
            isDark={isDark}
            matchId={searchParams.get('match') ? Number(searchParams.get('match')) : undefined}
          />
        )}

        {tab === 'jugar' && (
          <div className="space-y-5">
            <div
              className={`rounded-2xl border p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
                isDark
                  ? 'border-berry-500/20 bg-gradient-to-r from-berry-950/40 to-stone-950'
                  : 'border-berry-200 bg-gradient-to-r from-berry-50 to-white shadow-sm'
              }`}
            >
              <div>
                <h2 className={`font-display text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  Haz tus pronósticos
                </h2>
                <p className={`text-sm mt-1 ${theme.muted}`}>
                  {predictionCost} créditos por pick nuevo · editar antes del pitazo es gratis
                </p>
              </div>
              <div className="flex gap-3">
                <div
                  className={`rounded-xl px-4 py-2.5 text-center min-w-[7rem] ${
                    isDark ? 'bg-black/30 border border-white/10' : 'bg-white border border-berry-100'
                  }`}
                >
                  <p className={`text-[10px] uppercase ${theme.mutedSm}`}>Saldo</p>
                  <p className={`text-lg font-bold tabular-nums ${theme.accent}`}>
                    {credits.toLocaleString('es-CO')}
                  </p>
                </div>
                <div
                  className={`rounded-xl px-4 py-2.5 text-center min-w-[7rem] ${
                    isDark ? 'bg-black/30 border border-white/10' : 'bg-white border border-berry-100'
                  }`}
                >
                  <p className={`text-[10px] uppercase ${theme.mutedSm}`}>Picks</p>
                  <p className={`text-lg font-bold tabular-nums ${theme.accent}`}>
                    {data.predictions.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'live', label: 'En vivo' },
                  { id: 'upcoming', label: 'Próximos' },
                  { id: 'played', label: 'Jugados' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMatchPhase(f.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    matchPhase === f.id
                      ? 'bg-berry-600 text-white'
                      : isDark
                        ? 'bg-white/5 text-stone-400'
                        : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {f.label}
                  {f.id === 'live' && data.hasLiveMatches && (
                    <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse align-middle" />
                  )}
                </button>
              ))}
              <span className={`w-px h-6 self-center mx-1 ${isDark ? 'bg-white/10' : 'bg-stone-200'}`} />
              <button
                type="button"
                onClick={() => setMatchFilter('all')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  matchFilter === 'all'
                    ? 'bg-stone-600 text-white'
                    : isDark
                      ? 'bg-white/5 text-stone-400'
                      : 'bg-stone-100 text-stone-600'
                }`}
              >
                Todos los grupos
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-3">
            {filteredMatches.map((match) => (
              <div
                key={match.id}
                className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 lg:p-5 transition-shadow hover:shadow-md ${theme.cardSoft}`}
              >
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
                  <span
                    className={`text-[10px] ml-auto font-medium ${
                      match.isLive ? 'text-emerald-400' : theme.accentLink
                    }`}
                  >
                    {match.isLive ? `● ${match.statusLabel}` : match.startsIn}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TeamCrest src={match.homeTeam.crest} alt="" size={32} />
                  <div className="flex-1 text-center min-w-0">
                    <p className="text-xs font-medium truncate">
                      {match.homeTeam.tla} vs {match.awayTeam.tla}
                    </p>
                    {match.prediction ? (
                      <div className="mt-1">
                        <p className={`text-[9px] uppercase tracking-wide ${theme.accent}`}>Tu marcador</p>
                        <p className={`text-xl font-bold tabular-nums ${isDark ? 'text-berry-300' : 'text-berry-700'}`}>
                          {match.prediction.homeScore} - {match.prediction.awayScore}
                        </p>
                        {match.canViewHub && match.displayScore.home != null && (
                          <p className={`text-[10px] mt-0.5 ${theme.mutedSm}`}>
                            En vivo: {match.displayScore.home}-{match.displayScore.away}
                          </p>
                        )}
                      </div>
                    ) : match.canViewHub && match.displayScore.home != null ? (
                      <p className={`text-lg font-bold tabular-nums ${theme.accent}`}>
                        {match.displayScore.home} - {match.displayScore.away}
                      </p>
                    ) : (
                      <p className={`text-[10px] ${theme.mutedSm}`}>{match.formattedDate}</p>
                    )}
                  </div>
                  <TeamCrest src={match.awayTeam.crest} alt="" size={32} />
                </div>
                <div className="flex gap-2 mt-3">
                  {match.canViewHub && (
                    <button
                      type="button"
                      onClick={() => setLiveMatchId(match.id)}
                      className={`flex-1 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold border ${
                        match.isLive
                          ? 'border-emerald-500/50 bg-emerald-600/20 text-emerald-300'
                          : isDark
                            ? 'border-white/15 text-stone-200 hover:bg-white/5'
                            : 'border-stone-300 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {match.isLive ? 'Ver en vivo' : 'Ver partido'}
                    </button>
                  )}
                  {match.canPredict && (
                    <button
                      type="button"
                      onClick={() => openPredict(match)}
                      className="flex-1 py-1.5 sm:py-2 rounded-lg bg-berry-600 hover:bg-berry-500 text-white text-xs sm:text-sm font-semibold"
                    >
                      {match.prediction ? 'Editar' : 'Pronosticar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {tab === 'admin' && data.isPollAdmin && <PollaAdminPanel isDark={isDark} />}

        {tab === 'picks' && (
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 xl:grid-cols-3">
            {data.predictions.length === 0 ? (
              <div className={`col-span-full text-center py-12 text-sm ${theme.muted}`}>
                <IconTarget className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-stone-600' : 'text-stone-400'}`} />
                Aún no tienes pronósticos
                <button
                  type="button"
                  onClick={() => changeTab('jugar')}
                  className={`block mx-auto mt-4 font-semibold ${theme.accentLink}`}
                >
                  Ir a jugar →
                </button>
              </div>
            ) : (
              <>
                <p className={`col-span-full text-[10px] lg:text-xs text-center pb-1 ${theme.mutedSm}`}>
                  Puntos: +{data.scoringRules.exactScore} exacto · +{data.scoringRules.goalDifference} dif. · +{data.scoringRules.correctResult} resultado
                </p>
                {data.predictions.map((p) => (
                  <PredictionCard key={p.id} prediction={p} isDark={isDark} />
                ))}
              </>
            )}
          </div>
        )}
        <div className={`mt-6 lg:mt-8 pt-5 pb-2 lg:pb-0 border-t text-center ${theme.border} ${tab === 'ari' ? 'hidden lg:block' : ''}`}>
          <Link
            href="/mundial/reglamento"
            className={`inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
              isDark
                ? 'border-white/15 text-stone-200 hover:bg-white/5'
                : 'border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Ver reglamento completo →
          </Link>
        </div>
        </main>

        {/* Bottom nav móvil */}
        <nav
          className={`lg:hidden fixed bottom-0 inset-x-0 z-50 border-t backdrop-blur-xl safe-area-bottom transition-colors ${theme.header}`}
        >
          <div className="max-w-lg mx-auto flex">
            {mainTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => changeTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  tab === t.id ? theme.accentLink : theme.mutedSm
                }`}
              >
                <t.Icon className="w-5 h-5" />
                <span className="truncate max-w-full px-0.5">{t.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {liveMatchId != null && (
        <MatchLivePanel
          matchId={liveMatchId}
          isDark={isDark}
          onClose={() => setLiveMatchId(null)}
        />
      )}

      {activeMatch && (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-t-2xl lg:rounded-2xl border p-5 pb-8 lg:pb-5 shadow-2xl ${theme.card}`}>
            <div
              className={`lg:hidden w-10 h-1 rounded-full mx-auto mb-4 ${isDark ? 'bg-stone-700' : 'bg-stone-300'}`}
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
                  placeholder="–"
                  value={homeScore}
                  onChange={(e) => setHomeScore(parseScoreInput(e.target.value, maxScore))}
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
                  placeholder="–"
                  value={awayScore}
                  onChange={(e) => setAwayScore(parseScoreInput(e.target.value, maxScore))}
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
                disabled={
                  saving ||
                  homeScore === '' ||
                  awayScore === '' ||
                  (!activeMatch.prediction && credits < predictionCost)
                }
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
