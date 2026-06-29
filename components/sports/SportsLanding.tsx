'use client'

import GoogleSignInButton from '@/components/GoogleSignInButton'
import HomeBroadcastPromo from '@/components/sports/HomeBroadcastPromo'
import MundialThemeToggle from '@/components/sports/MundialThemeToggle'
import { useMundialTheme } from '@/hooks/useMundialTheme'
import { usePollaLiveSync } from '@/hooks/usePollaLiveSync'
import GroupStagePodium from '@/components/sports/GroupStagePodium'
import KnockoutBracketsPreview from '@/components/sports/KnockoutBracketsPreview'
import MundialHighlights from '@/components/sports/MundialHighlights'
import LiveSyncBadge from '@/components/sports/LiveSyncBadge'
import PollaLeaderboard from '@/components/sports/PollaLeaderboard'
import TeamCrest from '@/components/sports/TeamCrest'
import PollaPremiosPanel from '@/components/sports/PollaPremiosPanel'
import {
  GROUP_STAGE_NO_PASSPORT_NOTE,
  GROUP_STAGE_WINNERS_COUNT,
  GROUP_STAGE_PICKS_INCLUDED,
  INITIAL_CREDITS,
  KNOCKOUT_PASSPORT_ACQUIRE_NOTE,
  KNOCKOUT_PASSPORT_PRICE_LABEL,
  PREDICTION_COST,
  REGLAMENTO_SHORT,
} from '@/lib/polla-rules'
import type { KnockoutRound, WorldCupData } from '@/lib/football-data'
import type { MundialHighlight } from '@/lib/mundial-highlights'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { PERFIL_JUGAR_PATH, PERFIL_PATH, perfilPathForPlayMatch } from '@/lib/perfil-routes'
import { getGroupStagePodiumEntries } from '@/lib/polla-phase'
import type { LeaderboardEntry } from '@/lib/sports-polla-shared'
import { signIn, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type LandingWorldCup = WorldCupData & {
  knockoutRounds?: KnockoutRound[]
  highlights?: MundialHighlight[]
  pollaPlayers?: number
}

const NAV_LINKS = [
  { href: '#indicadores', label: 'Stats' },
  { href: '#premios', label: 'Premios' },
  { href: '#como-jugar', label: 'Cómo jugar' },
  { href: '#partidos', label: 'Partidos' },
  { href: '#llaves', label: 'Llaves' },
]

const STEPS = [
  {
    step: '1',
    title: 'Entra a jugar',
    desc: `${INITIAL_CREDITS.toLocaleString('es-CO')} créditos para la fase de grupos (${PREDICTION_COST} por partido, ≈${GROUP_STAGE_PICKS_INCLUDED} picks).`,
  },
  {
    step: '2',
    title: 'Elige tu usuario',
    desc: 'Define el nombre con el que aparecerás en la tabla pública del ranking.',
  },
  {
    step: '3',
    title: 'Haz tus pronósticos',
    desc: `Cada pick nuevo cuesta ${PREDICTION_COST} créditos. Editar antes del pitazo no consume créditos extra.`,
  },
  {
    step: '4',
    title: 'Dos premiaciones',
    desc: `Grupos: top ${GROUP_STAGE_WINNERS_COUNT} (aguardiente, cubetazo, shot + cerveza, cerveza). ${GROUP_STAGE_NO_PASSPORT_NOTE} Polla final desde cuartos: ${KNOCKOUT_PASSPORT_ACQUIRE_NOTE} Octavos solo entrenamiento.`,
  },
]

const FEATURES = [
  { icon: '⚽', title: 'Mundial 2026 completo', desc: 'Calendario, resultados y estadísticas en tiempo real.' },
  { icon: '🎯', title: 'Polla entre amigos', desc: 'La clásica polla mundialista, ahora digital y en vivo.' },
  { icon: '📈', title: 'Polla en vivo', desc: 'Partidos reales del Mundial para pronosticar al instante.' },
  { icon: '☕', title: 'Desde Arándano Café Bar', desc: 'Vive el Mundial con el café de tu tercer espacio en Pasto.' },
  { icon: '📱', title: 'Juega desde cualquier lugar', desc: 'Celular, tablet o computador — pronostica donde estés.' },
]

function formatSeasonDates(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  const from = new Date(start).toLocaleDateString('es-CO', opts)
  const to = new Date(end).toLocaleDateString('es-CO', opts)
  return `${from} — ${to}`
}

function MatchCard({
  match,
  onPredict,
  isDark,
}: {
  match: WorldCupData['upcomingMatches'][0]
  onPredict: () => void
  isDark: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 h-full transition-colors ${
        isDark
          ? 'border-white/10 bg-white/5 hover:border-berry-500/30'
          : 'border-stone-200 bg-white shadow-sm hover:border-berry-400/40 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="text-center flex-1">
          <div className="flex justify-center mb-1">
            <TeamCrest src={match.homeTeam.crest} alt={match.homeTeam.name} size={40} />
          </div>
          <p className={`text-xs font-medium truncate ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            {match.homeTeam.shortName}
          </p>
        </div>
        <span className={`font-bold text-xs shrink-0 ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>VS</span>
        <div className="text-center flex-1">
          <div className="flex justify-center mb-1">
            <TeamCrest src={match.awayTeam.crest} alt={match.awayTeam.name} size={40} />
          </div>
          <p className={`text-xs font-medium truncate ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            {match.awayTeam.shortName}
          </p>
        </div>
      </div>
      {match.group && (
        <p className={`text-center text-[10px] uppercase tracking-wide mb-1 ${isDark ? 'text-stone-600' : 'text-stone-500'}`}>
          {match.group.replace('_', ' ')}
        </p>
      )}
      <p className={`text-center text-xs mb-1 ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
        {match.formattedDate}
      </p>
      {match.isLive && match.displayScore.home != null ? (
        <p className={`text-center text-xl font-bold tabular-nums mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
          {match.displayScore.home} - {match.displayScore.away}
        </p>
      ) : null}
      <p className={`text-center text-xs font-medium mb-4 ${match.isLive ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : isDark ? 'text-berry-400' : 'text-berry-600'}`}>
        {match.isLive ? `En vivo · ${match.statusLabel}` : match.startsIn}
      </p>
      <button
        type="button"
        onClick={onPredict}
        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
          isDark
            ? 'bg-berry-600/20 hover:bg-berry-600/40 border border-berry-500/30 text-berry-300'
            : 'bg-berry-600 hover:bg-berry-500 text-white'
        }`}
      >
        Pronosticar
      </button>
    </div>
  )
}

export default function SportsLanding() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const authLoading = status === 'loading'
  const [wcData, setWcData] = useState<LandingWorldCup | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const { isDark, toggleTheme } = useMundialTheme()

  const loadLeaderboard = useCallback(async (silent = false) => {
    if (silent) setSyncing(true)
    try {
      const res = await fetch('/api/sports/leaderboard', { cache: 'no-store' })
      const data = await res.json()
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard)
        setLastSyncedAt(Date.now())
      }
    } catch {
      /* ignore */
    } finally {
      if (silent) setSyncing(false)
    }
  }, [])

  const refreshWorldCup = useCallback(async (silent = false) => {
    if (silent) setSyncing(true)
    try {
      const res = await fetch('/api/football/world-cup', { cache: 'no-store' })
      const data = await res.json()
      if (!data.error) {
        setWcData(data)
        setLastSyncedAt(Date.now())
      }
    } catch {
      /* ignore */
    } finally {
      if (silent) setSyncing(false)
    }
  }, [])

  const silentRefresh = useCallback(() => {
    void Promise.all([refreshWorldCup(true), loadLeaderboard(true)])
  }, [refreshWorldCup, loadLeaderboard])

  usePollaLiveSync(silentRefresh, {
    enabled: !loading,
    fallbackMs: wcData?.liveMatches?.length ? 20_000 : 40_000,
  })

  useEffect(() => {
    void Promise.all([
      fetch('/api/football/world-cup')
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setWcData(data)
        }),
      loadLeaderboard(),
    ])
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        setLastSyncedAt(Date.now())
      })
  }, [loadLeaderboard])

  const goToProfile = () => {
    if (authLoading) return
    if (session) {
      router.push(PERFIL_PATH)
    } else {
      void signIn('google', { callbackUrl: PERFIL_PATH })
    }
  }

  const goToPredict = (matchId?: number) => {
    if (authLoading) return
    const target = matchId ? perfilPathForPlayMatch(matchId) : PERFIL_JUGAR_PATH
    if (session) {
      router.push(target)
    } else {
      void signIn('google', { callbackUrl: target })
    }
  }

  const liveMatches = [
    ...(wcData?.liveMatches ?? []),
    ...(wcData?.upcomingMatches ?? []),
  ].slice(0, 12)

  const recentResults = (wcData?.recentMatches ?? []).slice(0, 6)
  const highlights = wcData?.highlights ?? []
  const knockoutRounds = wcData?.knockoutRounds ?? []

  const seasonDates = wcData
    ? formatSeasonDates(wcData.competition.startDate, wcData.competition.endDate)
    : '11 jun — 19 jul 2026'

  const theme = mundialTheme(isDark)
  const podiumEntries = getGroupStagePodiumEntries(leaderboard, false)

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-stone-950 text-white' : 'bg-stone-50 text-stone-900'
      }`}
    >
      {/* Nav */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${
          isDark ? 'border-white/10 bg-stone-950/80' : 'border-stone-200 bg-white/90'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-9 h-9 shrink-0">
              <Image src="/images/logo.png" alt="Arándano Café Bar" fill className="object-contain" sizes="36px" />
            </div>
            <span className="font-display font-bold text-lg leading-tight truncate">
              Arándano <span className="text-berry-400 text-sm font-semibold block -mt-0.5">Café Bar</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto max-w-[42vw] sm:max-w-none scrollbar-thin">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-2 rounded-full whitespace-nowrap transition-colors ${theme.muted} hover:text-berry-500`}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/mundial/reglamento"
                className={`text-sm font-medium px-3 py-2 rounded-full border transition-colors ${
                  isDark
                    ? 'border-white/15 text-stone-300 hover:bg-white/5'
                    : 'border-stone-300 text-stone-600 hover:bg-stone-100'
                }`}
              >
                Reglamento
              </Link>
              {session ? (
                <button
                  type="button"
                  onClick={goToProfile}
                  disabled={authLoading}
                  className="text-sm font-semibold px-4 py-2 rounded-full bg-berry-600 hover:bg-berry-500 text-white transition-colors disabled:opacity-60"
                >
                  Mi perfil
                </button>
              ) : (
                <GoogleSignInButton compact label="Iniciar sesión" className="!shadow-none" />
              )}
            </div>
            <div className="sm:hidden">
              {session ? (
                <button
                  type="button"
                  onClick={goToProfile}
                  disabled={authLoading}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-berry-600 hover:bg-berry-500 text-white transition-colors disabled:opacity-60"
                >
                  Mi perfil
                </button>
              ) : (
                <GoogleSignInButton compact label="Iniciar sesión" loggedInLabel="Mi perfil" />
              )}
            </div>
            <MundialThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <LiveSyncBadge
              isDark={isDark}
              syncing={syncing}
              lastSyncedAt={lastSyncedAt}
              isLive={(wcData?.liveMatches?.length ?? 0) > 0}
              className="hidden sm:inline-flex"
            />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-berry-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in-up">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-berry-300 bg-berry-950/60 border border-berry-500/30 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {wcData?.competition.name ?? 'Copa Mundial FIFA 2026'}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">
                Vive el Mundial con{' '}
                <span className="bg-gradient-to-r from-berry-300 to-berry-500 bg-clip-text text-transparent">
                  Arándano Café Bar
                </span>
              </h1>
              <p className="text-lg text-stone-400 leading-relaxed mb-4 max-w-xl">
                {wcData
                  ? `${wcData.stats.totalTeams} selecciones, ${wcData.stats.totalMatches} partidos del ${seasonDates}. Desde Pasto, celebra cada gol con nosotros.`
                  : 'El torneo más grande del planeta llega en 2026. Desde Pasto, celebra cada gol con nosotros.'}
              </p>
              <p className={`text-base leading-relaxed mb-6 max-w-xl font-medium ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                Pronostica el Mundial 2026, compite con tus parceros y gana premios en{' '}
                <span className={theme.accent}>dos fases</span>: grupos (top {GROUP_STAGE_WINNERS_COUNT}) y polla final desde cuartos ({KNOCKOUT_PASSPORT_PRICE_LABEL}).
              </p>

              {wcData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 max-w-xl">
                  {[
                    { label: 'Jugadores', value: wcData.pollaPlayers ?? leaderboard.length },
                    { label: 'Selecciones', value: wcData.stats.totalTeams },
                    { label: 'Partidos', value: wcData.stats.totalMatches },
                    { label: 'Jugados', value: wcData.stats.playedMatches },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`rounded-xl border px-2.5 py-2 text-center ${
                        isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-white'
                      }`}
                    >
                      <p className={`text-[9px] uppercase tracking-wide ${theme.mutedSm}`}>{s.label}</p>
                      <p className={`font-display text-lg font-bold tabular-nums ${theme.accent}`}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 max-w-md sm:max-w-none">
                {session ? (
                  <button
                    type="button"
                    onClick={() => goToPredict()}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-berry-600 hover:bg-berry-500 text-white font-semibold rounded-xl transition-colors"
                  >
                    Ir a pronosticar
                  </button>
                ) : (
                  <GoogleSignInButton label="Jugar con Google" callbackUrl={PERFIL_JUGAR_PATH} />
                )}
                <a
                  href="#premios"
                  className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 border font-semibold rounded-xl transition-colors ${
                    isDark
                      ? 'border-white/20 hover:bg-white/5 text-stone-200'
                      : 'border-stone-300 hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  Ver premios
                </a>
              </div>
            </div>

            {/* Transmisión en vivo + pronósticos */}
            <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <HomeBroadcastPromo isDark={isDark} onPredict={goToPredict} />
              {wcData?.colombiaNextMatch && (
                <p className={`text-xs text-center mt-3 ${theme.mutedSm}`}>
                  🇨🇴 Colombia: {wcData.colombiaNextMatch.homeTeam.name} vs{' '}
                  {wcData.colombiaNextMatch.awayTeam.name} · {wcData.colombiaNextMatch.startsIn}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Indicadores torneo + polla */}
      {(highlights.length > 0 || (wcData?.pollaPlayers ?? 0) > 0) && (
        <section
          id="indicadores"
          className={`py-10 sm:py-14 border-t scroll-mt-20 ${theme.borderSubtle} ${
            isDark ? 'bg-stone-950' : 'bg-stone-50'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <MundialHighlights
              highlights={highlights}
              isDark={isDark}
              playerCount={wcData?.pollaPlayers ?? leaderboard.length}
              playedMatches={wcData?.stats.playedMatches ?? 0}
            />
            {podiumEntries.length > 0 && (
              <div className="mt-8 max-w-lg mx-auto">
                <GroupStagePodium entries={podiumEntries} isDark={isDark} complete={false} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 1. Premios — motivación antes de jugar */}
      <section
        id="premios"
        className={`py-14 sm:py-20 border-t scroll-mt-20 ${theme.borderSubtle} ${
          isDark ? 'bg-stone-950' : 'bg-white'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${theme.accent}`}>
              01 · Premios
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold mb-2 sm:mb-3">
              ¿Qué puedes ganar?
            </h2>
            <p className={`text-sm sm:text-base max-w-2xl mx-auto ${theme.muted}`}>
              Grupos: top {GROUP_STAGE_WINNERS_COUNT} sin pasaporte. Polla final desde cuartos: {KNOCKOUT_PASSPORT_ACQUIRE_NOTE} Octavos solo entrenamiento.
            </p>
          </div>
          <div className="max-w-lg mx-auto">
            <PollaPremiosPanel isDark={isDark} />
          </div>
        </div>
      </section>

      {/* 2. Cómo jugar — entender el juego */}
      <section
        id="como-jugar"
        className={`py-14 sm:py-20 border-t scroll-mt-20 ${theme.borderSubtle} ${
          isDark ? 'bg-gradient-to-b from-stone-950 to-berry-950/15' : 'bg-gradient-to-b from-stone-50 to-berry-50/50'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-14">
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${theme.accent}`}>
              02 · Cómo jugar
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold mb-2 sm:mb-3">
              Cuatro pasos y listo
            </h2>
            <p className={`text-sm sm:text-base max-w-xl mx-auto ${theme.muted}`}>
              Regístrate gratis, pronostica antes del pitazo y sube en la tabla de tu fase.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className={`relative flex flex-col rounded-xl sm:rounded-2xl border p-3.5 sm:p-6 transition-all group h-full ${
                  isDark
                    ? 'border-white/10 bg-white/5 hover:border-berry-500/30 hover:bg-berry-950/30'
                    : 'border-stone-200 bg-white shadow-sm hover:border-berry-400/40 hover:shadow-md'
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold mb-2.5 sm:mb-4 text-sm sm:text-base shrink-0 transition-colors ${
                    isDark
                      ? 'bg-berry-600/20 border border-berry-500/30 text-berry-300 group-hover:bg-berry-600/30'
                      : 'bg-berry-100 border border-berry-300/60 text-berry-700 group-hover:bg-berry-200/70'
                  }`}
                >
                  {item.step}
                </div>
                <h3 className="font-semibold text-xs sm:text-lg mb-1 sm:mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className={`text-[10px] sm:text-sm leading-relaxed flex-1 ${theme.muted}`}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <p className={`text-center text-xs sm:text-sm mt-8 ${theme.muted}`}>
            {REGLAMENTO_SHORT} ·{' '}
            <Link href="/mundial/reglamento" className={`font-semibold ${theme.accentLink}`}>
              Leer reglamento completo →
            </Link>
          </p>
        </div>
      </section>

      {/* 3. Por qué Arándano — confianza y contexto local */}
      <section
        className={`py-14 sm:py-16 border-t ${theme.borderSubtle} ${
          isDark ? 'bg-stone-950' : 'bg-stone-50'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${theme.accent}`}>
              03 · Arándano Café Bar
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Tu tercer espacio en Pasto</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border p-5 sm:p-6 transition-all hover:-translate-y-0.5 ${
                  isDark
                    ? 'border-white/10 bg-white/5 hover:border-berry-500/30'
                    : 'border-stone-200 bg-white shadow-sm hover:border-berry-300/50 hover:shadow-md'
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-3 block">{f.icon}</span>
                <h3 className="font-semibold text-base sm:text-lg mb-1.5">{f.title}</h3>
                <p className={`text-sm leading-relaxed ${theme.muted}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Polla en vivo — acción: pronosticar */}
      <section
        id="partidos"
        className={`py-14 sm:py-20 border-t scroll-mt-20 ${theme.borderSubtle} ${
          isDark ? 'bg-stone-950' : 'bg-white'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${theme.accent}`}>
              04 · A jugar
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold mb-2 sm:mb-3">Pronostica ahora</h2>
            <p className={`text-sm sm:text-base max-w-xl mx-auto ${theme.muted}`}>
              Partidos reales del Mundial 2026. Elige tu marcador antes de que arranquen.
            </p>
          </div>
          {loading ? (
            <div className={`text-center py-12 text-sm ${theme.muted}`}>Cargando partidos del Mundial…</div>
          ) : liveMatches.length > 0 ? (
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:gap-5">
                {liveMatches.map((match) => (
                  <div key={match.id} className="min-w-[16.5rem] sm:min-w-0 snap-start shrink-0 sm:shrink">
                    <MatchCard match={match} onPredict={() => goToPredict(match.id)} isDark={isDark} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`text-center py-12 text-sm ${theme.muted}`}>
              No hay partidos disponibles por ahora.
            </div>
          )}

          {recentResults.length > 0 && (
            <div className="mt-10">
              <h3 className="font-semibold text-sm sm:text-base mb-3">Últimos resultados</h3>
              <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:gap-3">
                  {recentResults.map((m) => (
                    <div
                      key={m.id}
                      className={`min-w-[14rem] sm:min-w-0 snap-start shrink-0 sm:shrink rounded-xl border px-3 py-2.5 flex items-center gap-2 ${
                        isDark ? 'border-white/10 bg-white/5' : 'border-stone-200 bg-white'
                      }`}
                    >
                      <TeamCrest src={m.homeTeam.crest} alt="" size={22} />
                      <div className="flex-1 min-w-0 text-center">
                        <p className="text-[10px] font-medium truncate">
                          {m.homeTeam.shortName} {m.displayScore.home ?? '–'} - {m.displayScore.away ?? '–'}{' '}
                          {m.awayTeam.shortName}
                        </p>
                        <p className={`text-[9px] ${theme.mutedSm}`}>{m.stageLabel}</p>
                      </div>
                      <TeamCrest src={m.awayTeam.crest} alt="" size={22} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="max-w-xl mx-auto mt-10 sm:mt-12">
            <PollaLeaderboard entries={leaderboard} compact phase="group" isDark={isDark} />
          </div>
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => goToPredict()}
              className={`inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-berry-600 hover:bg-berry-500 text-white font-semibold text-sm transition-colors`}
            >
              Entrar y pronosticar
            </button>
          </div>
        </div>
      </section>

      {/* Llaves eliminatorias */}
      {knockoutRounds.length > 0 && (
        <section
          id="llaves"
          className={`py-12 sm:py-16 border-t scroll-mt-20 ${theme.borderSubtle} ${
            isDark ? 'bg-gradient-to-b from-stone-950 to-berry-950/10' : 'bg-gradient-to-b from-white to-berry-50/40'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-6 sm:mb-8">
              <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${theme.accent}`}>
                Llaves
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">Camino al título</h2>
            </div>
            <KnockoutBracketsPreview
              rounds={knockoutRounds}
              isDark={isDark}
              onPlayMatch={(id) => goToPredict(id)}
            />
          </div>
        </section>
      )}

      {/* 5. Mundial 2026 — contexto del torneo */}
      <section
        id="mundial"
        className={`py-12 sm:py-20 border-t scroll-mt-20 ${theme.borderSubtle} ${
          isDark
            ? 'bg-gradient-to-b from-stone-950 to-berry-950/20'
            : 'bg-gradient-to-b from-stone-50 to-berry-50/90'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            {wcData?.competition.emblem && (
              <div className="flex justify-center mb-4">
                <TeamCrest src={wcData.competition.emblem} alt="Mundial 2026" size={64} />
              </div>
            )}
            <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${theme.accent}`}>
              05 · El torneo
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold mb-2 sm:mb-3">Mundial FIFA 2026</h2>
            <p className={`text-sm sm:text-base max-w-2xl mx-auto ${theme.muted}`}>
              Por primera vez en tres países. {seasonDates} · calendario y resultados en tiempo real.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-12">
            {[
              { icon: '🌎', label: 'Sede', value: 'EE.UU., México y Canadá' },
              { icon: '📅', label: 'Fechas', value: seasonDates },
              { icon: '🏟️', label: 'Selecciones', value: wcData ? `${wcData.stats.totalTeams} equipos` : '48 equipos' },
              { icon: '⚽', label: 'Partidos', value: wcData ? `${wcData.stats.totalMatches} encuentros` : '104 encuentros' },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 text-center transition-colors h-full flex flex-col items-center justify-center ${
                  isDark
                    ? 'border-white/10 bg-white/5 hover:border-berry-500/30'
                    : 'border-stone-200 bg-white shadow-sm hover:border-berry-400/40 hover:shadow-md'
                }`}
              >
                <span className="text-2xl sm:text-3xl mb-2 sm:mb-3">{item.icon}</span>
                <p className={`text-[10px] sm:text-xs uppercase tracking-wide mb-1 ${theme.mutedSm}`}>
                  {item.label}
                </p>
                <p className={`font-semibold text-xs sm:text-sm leading-snug ${theme.resultText}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
          <div
            className={`rounded-xl sm:rounded-2xl border p-5 sm:p-8 text-center max-w-3xl mx-auto ${
              isDark
                ? 'border-berry-500/20 bg-berry-950/30'
                : 'border-berry-300/50 bg-gradient-to-br from-berry-50 to-white shadow-sm'
            }`}
          >
            <p
              className={`font-display text-lg sm:text-2xl font-bold mb-2 sm:mb-3 ${
                isDark ? 'text-berry-200' : 'text-berry-800'
              }`}
            >
              🇨🇴 {wcData?.colombiaQualified ? '¡Colombia clasificada!' : '¿Y Colombia?'}
            </p>
            <p className={`text-xs sm:text-base leading-relaxed ${theme.muted}`}>
              {wcData?.colombiaQualified
                ? 'Colombia estará en el Mundial 2026. Arma tu polla, invita a los parceros y pronostica cada partido.'
                : 'Arma tu polla y pronostica cada partido del Mundial 2026 mientras sigues el torneo.'}
            </p>
          </div>
        </div>
      </section>

      {/* 6. CTA final — registro */}
      <section
        id="ingresar"
        className={`py-16 sm:py-24 border-t scroll-mt-20 ${theme.borderSubtle} ${
          isDark
            ? 'bg-gradient-to-b from-stone-950 to-berry-950/30'
            : 'bg-gradient-to-b from-white to-berry-50'
        }`}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${theme.accent}`}>
            06 · Únete
          </p>
          <h2 className="font-display text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">
            ¿Listo para la polla?
          </h2>
          <p className={`mb-8 leading-relaxed text-sm sm:text-base ${theme.muted}`}>
            Entra con Google, recibe {INITIAL_CREDITS.toLocaleString('es-CO')} créditos para la fase de grupos y haz tu primer pronóstico en menos de un minuto.
          </p>

          <div className="max-w-lg mx-auto px-4 mb-8">
            <HomeBroadcastPromo isDark={isDark} onPredict={goToPredict} />
          </div>

          <div className="max-w-sm mx-auto space-y-4">
            {session && (
              <p className="text-berry-300 font-medium">
                ¡Parcero, {session.user?.name?.split(' ')[0]}! Ya estás en la polla.
              </p>
            )}
            {session ? (
              <>
                <button
                  type="button"
                  onClick={() => goToPredict()}
                  className="flex w-full items-center justify-center px-6 py-4 bg-berry-600 hover:bg-berry-500 text-white font-semibold rounded-2xl transition-colors"
                >
                  Ir a pronosticar
                </button>
                <Link
                  href="/mundial/reglamento"
                  className={`flex w-full items-center justify-center px-6 py-3 rounded-xl border font-medium text-sm transition-colors ${
                    isDark
                      ? 'border-white/15 text-stone-300 hover:bg-white/5'
                      : 'border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Reglamento de juego
                </Link>
              </>
            ) : (
              <>
                <GoogleSignInButton label="Jugar con Google" callbackUrl={PERFIL_JUGAR_PATH} />
                <Link
                  href="/mundial/reglamento"
                  className={`flex w-full items-center justify-center px-6 py-3 rounded-xl border font-medium text-sm transition-colors ${
                    isDark
                      ? 'border-white/15 text-stone-300 hover:bg-white/5'
                      : 'border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Reglamento de juego
                </Link>
              </>
            )}
            <p className={`text-xs ${isDark ? 'text-stone-600' : 'text-stone-500'}`}>
              Pronósticos entre amigos · Sin dinero real · Solo competencia y pasión por el fútbol
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`border-t py-12 transition-colors ${
          isDark ? 'border-white/10 bg-stone-950' : 'border-stone-200 bg-stone-100'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-display text-xl font-bold mb-4">
            Arándano <span className="text-berry-400">Café Bar</span>
          </p>
          <p className="text-stone-600 text-xs mb-2">© 2026 Arándano Café Bar · Pasto, Colombia</p>
          <Link href="/mundial/reglamento" className="text-xs text-berry-500/80 hover:text-berry-400">
            Reglamento y condiciones
          </Link>
        </div>
      </footer>
    </div>
  )
}
