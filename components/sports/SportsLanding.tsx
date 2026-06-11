'use client'

import GoogleSignInButton from '@/components/GoogleSignInButton'
import PollaLeaderboard from '@/components/sports/PollaLeaderboard'
import TeamCrest from '@/components/sports/TeamCrest'
import {
  INITIAL_CREDITS,
  PREDICTION_COST,
  REGLAMENTO_SHORT,
  TOP_WINNERS_COUNT,
} from '@/lib/polla-rules'
import type { WorldCupData } from '@/lib/football-data'
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
    title: 'Sube en la tabla',
    desc: `Suma puntos con aciertos exactos, por diferencia o por resultado. Los créditos no afectan el ranking. Podio de ${TOP_WINNERS_COUNT} ganadores.`,
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
}: {
  match: WorldCupData['upcomingMatches'][0]
  onPredict: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-berry-500/30 transition-colors">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="text-center flex-1">
          <div className="flex justify-center mb-1">
            <TeamCrest src={match.homeTeam.crest} alt={match.homeTeam.name} size={40} />
          </div>
          <p className="text-xs text-stone-400 font-medium truncate">{match.homeTeam.shortName}</p>
        </div>
        <span className="text-stone-600 font-bold text-xs shrink-0">VS</span>
        <div className="text-center flex-1">
          <div className="flex justify-center mb-1">
            <TeamCrest src={match.awayTeam.crest} alt={match.awayTeam.name} size={40} />
          </div>
          <p className="text-xs text-stone-400 font-medium truncate">{match.awayTeam.shortName}</p>
        </div>
      </div>
      {match.group && (
        <p className="text-center text-[10px] text-stone-600 uppercase tracking-wide mb-1">
          {match.group.replace('_', ' ')}
        </p>
      )}
      <p className="text-center text-xs text-stone-500 mb-1">{match.formattedDate}</p>
      <p className="text-center text-xs text-berry-400 font-medium mb-4">{match.startsIn}</p>
      <button
        type="button"
        onClick={onPredict}
        className="w-full py-2.5 rounded-xl bg-berry-600/20 hover:bg-berry-600/40 border border-berry-500/30 text-berry-300 font-semibold text-sm transition-colors"
      >
        Pronosticar
      </button>
    </div>
  )
}

function MatchRow({ match }: { match: WorldCupData['upcomingMatches'][0] }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors">
      <TeamCrest src={match.homeTeam.crest} alt={match.homeTeam.tla} size={28} />
      <span className="text-xs text-stone-500 w-8 text-center shrink-0">vs</span>
      <TeamCrest src={match.awayTeam.crest} alt={match.awayTeam.tla} size={28} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {match.homeTeam.tla} — {match.awayTeam.tla}
        </p>
        <p className="text-xs text-stone-500">{match.startsIn}</p>
      </div>
      <span className="text-[10px] text-berry-400 font-medium shrink-0 uppercase">
        {match.status === 'TIMED' ? 'Programado' : match.status}
      </span>
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

    loadLeaderboard()
    const interval = setInterval(loadLeaderboard, 60_000)
    return () => clearInterval(interval)
  }, [])

  const goToLoginOrPlay = () => {
    if (authLoading) return
    if (session) {
      router.push('/perfil')
    } else {
      void signIn('google', { callbackUrl: '/perfil' })
    }
  }

  const heroMatches = wcData?.upcomingMatches.slice(0, 3) ?? []
  const liveMatches = wcData?.upcomingMatches ?? []

  const stats = wcData
    ? [
        { value: String(wcData.stats.totalMatches), label: 'Partidos' },
        { value: String(wcData.stats.totalTeams), label: 'Selecciones' },
        { value: '3', label: 'Países sede' },
        { value: '1', label: 'Campeón' },
      ]
    : [
        { value: '—', label: 'Partidos' },
        { value: '—', label: 'Selecciones' },
        { value: '3', label: 'Países sede' },
        { value: '1', label: 'Campeón' },
      ]

  const seasonDates = wcData
    ? formatSeasonDates(wcData.competition.startDate, wcData.competition.endDate)
    : '11 jun — 19 jul 2026'

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-stone-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9">
              <Image src="/images/logo.png" alt="Arándano Café Bar" fill className="object-contain" sizes="36px" />
            </div>
            <span className="font-display font-bold text-lg leading-tight">
              Arándano <span className="text-berry-400 text-sm font-semibold block -mt-0.5">Café Bar</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/mundial/reglamento"
              className="text-xs sm:text-sm font-medium px-3 py-2 rounded-full border border-white/15 text-stone-300 hover:bg-white/5 transition-colors"
            >
              Reglamento
            </Link>
            <button
              type="button"
              onClick={goToLoginOrPlay}
              disabled={authLoading}
              className="text-sm font-semibold px-4 py-2 rounded-full bg-berry-600 hover:bg-berry-500 transition-colors disabled:opacity-60"
            >
              {authLoading ? '…' : session ? 'Mi perfil' : 'Iniciar sesión'}
            </button>
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
              <p className="text-base text-stone-300 leading-relaxed mb-8 max-w-xl font-medium">
                ¿Quieres jugar la <span className="text-berry-300">polla mundialista</span>? Entra a jugar
                con tus amigos y ganar. Demuestra que eres un experto.
              </p>
              <div id="iniciar-sesion" className="flex flex-col sm:flex-row gap-3 scroll-mt-24">
                <GoogleSignInButton
                  label="Iniciar sesión con Google"
                  loggedInLabel="⚽ Ir a mi perfil"
                  callbackUrl="/perfil"
                  className="!w-auto min-w-[260px]"
                />
                <button
                  type="button"
                  onClick={goToLoginOrPlay}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-white/20 hover:bg-white/5 text-stone-200 font-semibold rounded-xl transition-colors"
                >
                  {session ? 'Ir a mi perfil' : 'Iniciar sesión'}
                </button>
              </div>
            </div>

            {/* Polla en vivo preview */}
            <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wide">Polla en vivo</p>
                    <p className="font-semibold text-sm mt-0.5">Próximos partidos</p>
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
                      <MatchRow key={match.id} match={match} />
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

      {/* Polla en vivo */}
      <section id="polla-vivo" className="py-20 border-t border-white/5 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-3">Polla en vivo</h2>
          <p className="text-stone-500 text-center text-sm mb-10">
            Partidos reales del Mundial 2026 — pronostica antes de que arranquen
          </p>
          {loading ? (
            <div className="text-center py-12 text-stone-500">Cargando partidos del Mundial…</div>
          ) : liveMatches.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} onPredict={goToLoginOrPlay} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-500">No hay partidos disponibles por ahora.</div>
          )}
          <div className="max-w-xl mx-auto mt-12 mb-8">
            <PollaLeaderboard entries={leaderboard} compact />
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={goToLoginOrPlay}
              className="text-berry-400 hover:text-berry-300 font-semibold text-sm transition-colors"
            >
              Jugar la polla →
            </button>
          </div>
        </div>
      </section>

      {/* Info Mundial 2026 */}
      <section id="mundial" className="py-20 border-t border-white/5 bg-gradient-to-b from-stone-950 to-berry-950/20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            {wcData?.competition.emblem && (
              <div className="flex justify-center mb-4">
                <TeamCrest src={wcData.competition.emblem} alt="Mundial 2026" size={64} />
              </div>
            )}
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Mundial FIFA 2026</h2>
            <p className="text-stone-400 max-w-2xl mx-auto">
              Por primera vez en la historia, el Mundial se juega en tres países. Calendario y resultados
              actualizados en tiempo real.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              { icon: '🌎', label: 'Sede', value: 'EE.UU., México y Canadá' },
              { icon: '📅', label: 'Fechas', value: seasonDates },
              { icon: '🏟️', label: 'Selecciones', value: wcData ? `${wcData.stats.totalTeams} equipos` : '48 equipos' },
              { icon: '⚽', label: 'Partidos', value: wcData ? `${wcData.stats.totalMatches} encuentros` : '104 encuentros' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center hover:border-berry-500/30 transition-colors"
              >
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <p className="text-xs text-stone-500 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="font-semibold text-white text-sm">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-berry-500/20 bg-berry-950/30 p-6 sm:p-8 text-center max-w-3xl mx-auto">
            <p className="text-berry-200 font-display text-xl sm:text-2xl font-bold mb-3">
              🇨🇴 {wcData?.colombiaQualified ? '¡Colombia clasificada!' : '¿Y Colombia?'}
            </p>
            <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
              {wcData?.colombiaQualified
                ? 'La Tricolor estará en el Mundial 2026. Arma tu polla, invita a los parceros y pronostica cada partido de Colombia.'
                : 'La Tricolor busca su cupo. Mientras tanto, arma tu polla y pronostica cada partido del Mundial 2026.'}
            </p>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 border-t border-white/5 bg-stone-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">¿Cómo jugar la polla?</h2>
            <p className="text-stone-400 max-w-lg mx-auto">
              La polla mundialista clásica, ahora en digital. Sin complicaciones, solo fútbol y amigos.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-berry-500/30 hover:bg-berry-950/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-berry-600/20 border border-berry-500/30 flex items-center justify-center text-berry-300 font-bold mb-4 group-hover:bg-berry-600/30 transition-colors">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-14">¿Por qué jugar aquí?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:-translate-y-1 transition-transform"
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-4xl sm:text-5xl font-bold bg-gradient-to-b from-white to-stone-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-stone-500 text-sm mt-2 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reglamento CTA */}
      <section className="py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-berry-400 text-xs font-semibold uppercase tracking-widest mb-3">Antes de jugar</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Lee el reglamento completo</h2>
          <p className="text-stone-400 text-sm mb-2">{REGLAMENTO_SHORT}</p>
          <p className="text-stone-500 text-xs mb-8 max-w-md mx-auto">
            Créditos, puntos, ejemplos, podio de 5 ganadores y condiciones de participación explicados al detalle.
          </p>
          <Link
            href="/mundial/reglamento"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-berry-500/40 bg-berry-950/40 text-berry-200 font-semibold hover:bg-berry-900/50 transition-colors"
          >
            Ver reglamento y condiciones →
          </Link>
        </div>
      </section>

      {/* CTA + Login */}
      <section id="ingresar" className="py-24 border-t border-white/5 scroll-mt-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-berry-400 text-sm font-semibold uppercase tracking-widest mb-4">Polla Mundialista</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            ¿Quieres jugar la polla mundialista?
          </h2>
          <p className="text-stone-400 mb-10 leading-relaxed">
            Entra a jugar con tus amigos y ganar. Demuestra que eres un experto del fútbol
            y lleva la cima de la tabla durante todo el Mundial 2026.
          </p>

          <div className="max-w-sm mx-auto space-y-4">
            {session && (
              <p className="text-berry-300 font-medium">
                ¡Parcero, {session.user?.name?.split(' ')[0]}! Ya estás en la polla.
              </p>
            )}
            <GoogleSignInButton
              label="Iniciar sesión con Google"
              loggedInLabel="Ir a mi perfil"
              callbackUrl="/perfil"
            />
            <button
              type="button"
              onClick={goToLoginOrPlay}
              className="w-full py-3 rounded-xl border border-white/15 text-stone-300 hover:bg-white/5 font-medium text-sm transition-colors"
            >
              {session ? 'Ir a mi perfil' : 'Iniciar sesión'}
            </button>
            <p className="text-xs text-stone-600">
              Pronósticos entre amigos · Sin dinero real · Solo competencia y pasión por el fútbol
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 bg-stone-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-display text-xl font-bold mb-2">
            Arándano <span className="text-berry-400">Café Bar</span>
          </p>
          <p className="text-stone-500 text-sm leading-relaxed max-w-md mx-auto mb-1">
            Vive el Mundial 2026 desde tu tercer espacio en Pasto.
          </p>
          <p className="text-stone-500 text-sm mb-6">Polla mundialista · Pronósticos · Amigos · Fútbol</p>
          <p className="text-stone-600 text-xs mb-2">© 2026 Arándano Café Bar · Pasto, Colombia</p>
          <Link href="/mundial/reglamento" className="text-xs text-berry-500/80 hover:text-berry-400">
            Reglamento y condiciones
          </Link>
        </div>
      </footer>
    </div>
  )
}
