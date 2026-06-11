'use client'

import GoogleSignInButton from '@/components/GoogleSignInButton'
import MundialThemeToggle from '@/components/sports/MundialThemeToggle'
import { useMundialTheme } from '@/hooks/useMundialTheme'
import PollaLeaderboard from '@/components/sports/PollaLeaderboard'
import TeamCrest from '@/components/sports/TeamCrest'
import PollaPremiosPanel from '@/components/sports/PollaPremiosPanel'
import {
  GROUP_STAGE_NO_PASSPORT_NOTE,
  GROUP_STAGE_WINNERS_COUNT,
  INITIAL_CREDITS,
  KNOCKOUT_PASSPORT_ACQUIRE_NOTE,
  PREDICTION_COST,
  REGLAMENTO_SHORT,
} from '@/lib/polla-rules'
import type { WorldCupData } from '@/lib/football-data'
import { mundialTheme } from '@/lib/mundial-theme-classes'
import { PERFIL_JUGAR_PATH, PERFIL_PATH } from '@/lib/perfil-routes'
import type { LeaderboardEntry } from '@/lib/sports-polla-shared'
import { signIn, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const STEPS = [
  {
    step: '1',
    title: 'Entra a jugar',
    desc: 'Ingresa con Google y recibe tus créditos virtuales de bienvenida.',
  },
  {
    step: '2',
    title: 'Elige tu usuario',
    desc: 'Define el nombre con el que aparecerás en la tabla pública del ranking.',
  },
  {
    step: '3',
    title: 'Haz tus pronósticos',
    desc: `Cada pick nuevo cuesta ${PREDICTION_COST} créditos (${INITIAL_CREDITS.toLocaleString('es-CO')} de bienvenida). Editar antes del pitazo no consume créditos extra.`,
  },
  {
    step: '4',
    title: 'Dos premiaciones',
    desc: `Grupos: ${GROUP_STAGE_WINNERS_COUNT} ganadores (aguardiente y cubetazo de cerveza). ${GROUP_STAGE_NO_PASSPORT_NOTE} Eliminatorias: ${KNOCKOUT_PASSPORT_ACQUIRE_NOTE}`,
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
      className={`rounded-2xl border p-5 transition-colors ${
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

function MatchRow({
  match,
  isDark,
}: {
  match: WorldCupData['upcomingMatches'][0]
  isDark: boolean
}) {
  const hasScore = match.displayScore?.home != null && match.displayScore?.away != null
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors">
      <TeamCrest src={match.homeTeam.crest} alt={match.homeTeam.tla} size={28} />
      <span className="text-xs text-stone-500 w-8 text-center shrink-0">vs</span>
      <TeamCrest src={match.awayTeam.crest} alt={match.awayTeam.tla} size={28} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {match.homeTeam.tla} — {match.awayTeam.tla}
        </p>
        <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-600'}`}>
          {match.isLive ? `En vivo · ${match.statusLabel}` : match.startsIn}
        </p>
      </div>
      {hasScore ? (
        <span className={`text-sm font-bold tabular-nums shrink-0 ${match.isLive ? 'text-emerald-400' : 'text-berry-400'}`}>
          {match.displayScore.home} - {match.displayScore.away}
        </span>
      ) : (
        <span className="text-[10px] text-berry-400 font-medium shrink-0 uppercase">
          {match.statusLabel}
        </span>
      )}
    </div>
  )
}

export default function SportsLanding() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const authLoading = status === 'loading'
  const [wcData, setWcData] = useState<WorldCupData | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { isDark, toggleTheme } = useMundialTheme()

  const loadLeaderboard = () => {
    fetch('/api/sports/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard) setLeaderboard(data.leaderboard)
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetch('/api/football/world-cup')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setWcData(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    const refreshWc = () => {
      fetch('/api/football/world-cup')
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setWcData(data)
        })
        .catch(() => {})
    }

    loadLeaderboard()
    const wcInterval = setInterval(refreshWc, 60_000)
    const lbInterval = setInterval(loadLeaderboard, 60_000)
    return () => {
      clearInterval(wcInterval)
      clearInterval(lbInterval)
    }
  }, [])

  const goToProfile = () => {
    if (authLoading) return
    if (session) {
      router.push(PERFIL_PATH)
    } else {
      void signIn('google', { callbackUrl: PERFIL_PATH })
    }
  }

  const goToPredict = () => {
    if (authLoading) return
    if (session) {
      router.push(PERFIL_JUGAR_PATH)
    } else {
      void signIn('google', { callbackUrl: PERFIL_JUGAR_PATH })
    }
  }

  const heroMatches =
    wcData?.liveMatches?.length
      ? wcData.liveMatches.slice(0, 3)
      : (wcData?.upcomingMatches.slice(0, 3) ?? [])
  const liveMatches = [
    ...(wcData?.liveMatches ?? []),
    ...(wcData?.upcomingMatches ?? []),
  ].slice(0, 12)

  const seasonDates = wcData
    ? formatSeasonDates(wcData.competition.startDate, wcData.competition.endDate)
    : '11 jun — 19 jul 2026'

  const theme = mundialTheme(isDark)

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
            <div className="hidden md:flex items-center gap-1">
              <a
                href="#premios"
                className={`text-xs font-medium px-2.5 py-2 rounded-full transition-colors ${theme.muted} hover:text-berry-500`}
              >
                Premios
              </a>
              <a
                href="#como-jugar"
                className={`text-xs font-medium px-2.5 py-2 rounded-full transition-colors ${theme.muted} hover:text-berry-500`}
              >
                Cómo jugar
              </a>
              <a
                href="#partidos"
                className={`text-xs font-medium px-2.5 py-2 rounded-full transition-colors ${theme.muted} hover:text-berry-500`}
              >
                Partidos
              </a>
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
              <p className={`text-base leading-relaxed mb-8 max-w-xl font-medium ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                Pronostica el Mundial 2026, compite con tus parceros y gana premios en{' '}
                <span className={theme.accent}>dos fases</span>: grupos y eliminatorias.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md sm:max-w-none">
                {session ? (
                  <button
                    type="button"
                    onClick={goToPredict}
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

            {/* Polla en vivo preview */}
            <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide">Polla en vivo</p>
                    <p className="font-semibold text-sm mt-0.5">
                      {wcData?.liveMatches?.length ? 'Partidos en juego' : 'Próximos partidos'}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {loading ? 'Cargando…' : 'En vivo'}
                  </span>
                </div>
                {loading ? (
                  <div className="px-5 py-8 text-center text-sm text-stone-500">Cargando partidos…</div>
                ) : heroMatches.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {heroMatches.map((match) => (
                      <MatchRow key={match.id} match={match} isDark={isDark} />
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-stone-500">Sin partidos programados</div>
                )}
                {wcData?.colombiaNextMatch && (
                  <div className="px-5 py-3 bg-white/5 border-t border-white/10">
                    <p className="text-xs text-stone-500 text-center">
                      🇨🇴 Colombia: {wcData.colombiaNextMatch.homeTeam.name} vs {wcData.colombiaNextMatch.awayTeam.name} · {wcData.colombiaNextMatch.startsIn}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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
              Primera polla: {GROUP_STAGE_NO_PASSPORT_NOTE} Segunda polla: {KNOCKOUT_PASSPORT_ACQUIRE_NOTE}
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} onPredict={goToPredict} isDark={isDark} />
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 text-sm ${theme.muted}`}>
              No hay partidos disponibles por ahora.
            </div>
          )}
          <div className="max-w-xl mx-auto mt-10 sm:mt-12">
            <PollaLeaderboard entries={leaderboard} compact phase="group" isDark={isDark} />
          </div>
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={goToPredict}
              className={`inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-berry-600 hover:bg-berry-500 text-white font-semibold text-sm transition-colors`}
            >
              Entrar y pronosticar
            </button>
          </div>
        </div>
      </section>

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
                ? 'La Tricolor estará en el Mundial 2026. Arma tu polla, invita a los parceros y pronostica cada partido de Colombia.'
                : 'La Tricolor busca su cupo. Mientras tanto, arma tu polla y pronostica cada partido del Mundial 2026.'}
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
            Entra con Google, recibe tus créditos de bienvenida y haz tu primer pronóstico en menos de un minuto.
          </p>

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
                  onClick={goToPredict}
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
