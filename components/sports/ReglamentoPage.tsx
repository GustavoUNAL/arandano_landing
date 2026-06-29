'use client'

import { IconInfo, IconTarget, IconTrophy } from '@/components/sports/SportsIcons'
import MundialThemeToggle from '@/components/sports/MundialThemeToggle'
import TeamFlag from '@/components/sports/TeamFlag'
import { useMundialTheme } from '@/hooks/useMundialTheme'
import { mundialTheme, scoringTierClass } from '@/lib/mundial-theme-classes'
import PollaPremiosPanel from '@/components/sports/PollaPremiosPanel'
import {
  CONDICIONES_LEGALES,
  GROUP_STAGE_WINNERS_COUNT,
  GROUP_STAGE_PICKS_INCLUDED,
  INITIAL_CREDITS,
  GROUP_STAGE_NO_PASSPORT_NOTE,
  KNOCKOUT_PASSPORT_ACQUIRE_NOTE,
  MIN_SETTLED_PICKS_TO_WIN,
  POINTS_CORRECT_RESULT,
  POINTS_EXACT_SCORE,
  POINTS_GOAL_DIFFERENCE,
  PREDICTION_COST,
  POLL_NAME,
  REGLAMENTO_SECTIONS,
  SCORING_EXAMPLES,
} from '@/lib/polla-rules'
import { PERFIL_JUGAR_PATH } from '@/lib/perfil-routes'
import { signIn, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'

export default function ReglamentoPage() {
  const { data: session } = useSession()
  const { isDark, toggleTheme } = useMundialTheme()
  const t = mundialTheme(isDark)

  const goPlay = () => {
    if (session) window.location.href = PERFIL_JUGAR_PATH
    else signIn('google', { callbackUrl: PERFIL_JUGAR_PATH })
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${t.page}`}>
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors ${t.header}`}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/mundial" className="text-sm text-berry-400 font-medium shrink-0">
            ← Polla
          </Link>
          <span className="font-display font-bold text-sm truncate">Reglamento</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={goPlay}
              className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-full bg-berry-600 hover:bg-berry-500 text-white shrink-0"
            >
              Jugar
            </button>
            <MundialThemeToggle isDark={isDark} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={`relative overflow-hidden border-b transition-colors ${t.border}`}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[100px] ${
              isDark ? 'bg-berry-600/25' : 'bg-berry-400/20'
            }`}
          />
          <div
            className={`absolute bottom-0 right-0 w-72 h-72 rounded-full blur-[80px] ${
              isDark ? 'bg-emerald-600/10' : 'bg-emerald-400/15'
            }`}
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-14 sm:py-20">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0">
              <div className="absolute inset-0 rounded-full bg-berry-600/20 blur-2xl" />
              <Image
                src="/soccer-ball.png"
                alt=""
                width={176}
                height={176}
                className="relative object-contain drop-shadow-2xl animate-soccer-juggle"
                priority
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-berry-400 text-xs font-semibold uppercase tracking-widest mb-2">
                {POLL_NAME}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Reglamento y condiciones
              </h1>
              <p className={`text-base sm:text-lg leading-relaxed max-w-xl ${t.muted}`}>
                Todo lo que necesitas saber para jugar, sumar puntos y competir por los premios de la
                fase de grupos (top {GROUP_STAGE_WINNERS_COUNT}) y la polla final desde cuartos de final.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resumen visual */}
      <section className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              icon: '💰',
              title: `${INITIAL_CREDITS.toLocaleString('es-CO')} créditos`,
              sub: `Saldo inicial para la fase de grupos. Con ${PREDICTION_COST} créditos por partido alcanza para unos ${GROUP_STAGE_PICKS_INCLUDED} pronósticos.`,
            },
            {
              icon: '🎯',
              title: `${POINTS_EXACT_SCORE} · ${POINTS_GOAL_DIFFERENCE} · ${POINTS_CORRECT_RESULT} pts`,
              sub: `Exacto (${POINTS_EXACT_SCORE}): marcador idéntico. Dif. (${POINTS_GOAL_DIFFERENCE}): misma diferencia de goles. Resultado (${POINTS_CORRECT_RESULT}): ganador o empate correcto.`,
            },
            {
              icon: '🏆',
              title: 'Dos premiaciones',
              sub: `Grupos: ${GROUP_STAGE_WINNERS_COUNT} ganadores. ${GROUP_STAGE_NO_PASSPORT_NOTE} Eliminatorias: ${KNOCKOUT_PASSPORT_ACQUIRE_NOTE}`,
            },
          ].map((card) => (
            <div
              key={card.title}
              className={`rounded-2xl border backdrop-blur p-4 text-center shadow-xl transition-colors ${t.card}`}
            >
              <span className="text-2xl">{card.icon}</span>
              <p
                className={`font-display font-bold mt-2 text-sm sm:text-base ${
                  isDark ? 'text-berry-300' : 'text-berry-600'
                }`}
              >
                {card.title}
              </p>
              <p className={`text-[10px] mt-1 ${t.mutedSm}`}>{card.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premiaciones */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <PollaPremiosPanel isDark={isDark} />
      </section>

      {/* Ejemplos de puntuación */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <IconTarget className="w-5 h-5 text-berry-400 shrink-0" />
          <h2 className="font-display text-xl sm:text-2xl font-bold">Ejemplos de puntuación</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {SCORING_EXAMPLES.map((ex) => (
            <div
              key={`${ex.match}-${ex.label}`}
              className={`rounded-xl sm:rounded-2xl border p-3 sm:p-5 transition-colors flex flex-col h-full ${scoringTierClass(ex.color, isDark)}`}
            >
              <p className="text-[9px] sm:text-xs uppercase tracking-wide opacity-80 mb-1 sm:mb-2 leading-tight">
                {ex.label}
              </p>
              <p className={`text-[9px] sm:text-xs mb-2 sm:mb-3 leading-tight ${t.mutedSm}`}>
                {ex.match}
              </p>
              <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-2 sm:mb-4">
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <TeamFlag code={ex.homeFlag} alt={ex.home} className="h-5 w-[30px] sm:h-7 sm:w-[42px]" />
                  <span className="text-[9px] sm:text-xs font-medium truncate w-full text-center leading-tight">
                    {ex.home}
                  </span>
                </div>
                <span className={`text-[8px] sm:text-[10px] font-semibold shrink-0 ${t.mutedSm}`}>
                  vs
                </span>
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <TeamFlag code={ex.awayFlag} alt={ex.away} className="h-5 w-[30px] sm:h-7 sm:w-[42px]" />
                  <span className="text-[9px] sm:text-xs font-medium truncate w-full text-center leading-tight">
                    {ex.away}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-4 mb-2 sm:mb-3 flex-1">
                <div className="text-center min-w-0">
                  <p className={`text-[8px] sm:text-[10px] mb-0.5 sm:mb-1 ${t.mutedSm}`}>Tu pick</p>
                  <p className="font-display text-base sm:text-2xl font-bold tabular-nums leading-none">
                    {ex.predictionHome}–{ex.predictionAway}
                  </p>
                </div>
                <span className={`text-xs sm:text-base shrink-0 ${t.arrow}`}>→</span>
                <div className="text-center min-w-0">
                  <p className={`text-[8px] sm:text-[10px] mb-0.5 sm:mb-1 ${t.mutedSm}`}>Real</p>
                  <p
                    className={`font-display text-base sm:text-2xl font-bold tabular-nums leading-none ${t.resultText}`}
                  >
                    {ex.resultHome}–{ex.resultAway}
                  </p>
                </div>
              </div>
              <p className="text-center font-bold text-sm sm:text-lg mt-auto">
                {ex.points > 0 ? `+${ex.points} pt${ex.points === 1 ? '' : 's'}` : '0 pts'}
              </p>
            </div>
          ))}
        </div>
        <p className={`text-[10px] sm:text-xs mt-3 sm:mt-4 text-center ${t.mutedSm}`}>
          En cada partido solo se otorga el mejor nivel alcanzado (no se suman).
        </p>
      </section>

      {/* Reglamento completo */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <IconTrophy className="w-5 h-5 text-berry-400" />
          <h2 className="font-display text-2xl font-bold">Reglamento de juego</h2>
        </div>
        <div className="space-y-6">
          {REGLAMENTO_SECTIONS.map((section) => (
            <article
              key={section.id}
              className={`rounded-2xl border p-6 transition-colors ${t.cardSoft}`}
            >
              <h3
                className={`font-semibold mb-4 ${isDark ? 'text-berry-300' : 'text-berry-600'}`}
              >
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item} className={`text-sm leading-relaxed ${t.body}`}>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Créditos explicados */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className={`rounded-2xl border p-6 sm:p-8 transition-colors ${t.creditsBox}`}>
          <h2 className="font-display text-xl font-bold mb-4">Créditos vs puntos</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className={`font-semibold mb-2 ${isDark ? 'text-berry-300' : 'text-berry-600'}`}>
                Créditos virtuales
              </p>
              <ul className={`space-y-2 list-disc list-inside ${t.muted}`}>
                <li>Al registrarte recibes {INITIAL_CREDITS.toLocaleString('es-CO')} créditos para la fase de grupos.</li>
                <li>Cada pronóstico nuevo consume {PREDICTION_COST} créditos (saldo inicial ≈ {GROUP_STAGE_PICKS_INCLUDED} partidos).</li>
                <li>Editar un pronóstico antes del inicio del partido no consume créditos adicionales.</li>
                <li>Los créditos se utilizan únicamente para participar.</li>
              </ul>
            </div>
            <div>
              <p className={`font-semibold mb-2 ${isDark ? 'text-berry-300' : 'text-berry-600'}`}>
                Puntos de ranking
              </p>
              <ul className={`space-y-2 list-disc list-inside ${t.muted}`}>
                <li>Marcador exacto: {POINTS_EXACT_SCORE} pts.</li>
                <li>Diferencia correcta: {POINTS_GOAL_DIFFERENCE} pts.</li>
                <li>Resultado correcto: {POINTS_CORRECT_RESULT} pt.</li>
                <li>Solo cuentan para el ranking.</li>
                <li>Todos los participantes comienzan con 0 puntos.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Condiciones legales */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <IconInfo className={`w-5 h-5 ${isDark ? 'text-stone-400' : 'text-stone-500'}`} />
          <h2 className="font-display text-2xl font-bold">Condiciones y privacidad</h2>
        </div>
        <div className="space-y-4">
          {CONDICIONES_LEGALES.map((section) => (
            <article
              key={section.id}
              className={`rounded-xl border p-5 transition-colors ${t.cardLegal}`}
            >
              <h3 className={`font-semibold mb-3 text-sm ${t.legalTitle}`}>{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className={`text-xs leading-relaxed pl-3 border-l ${t.legalBorder} ${t.mutedSm}`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={`border-t py-14 transition-colors ${t.ctaSection}`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image src="/images/logo.png" alt="Arándano" fill className="object-contain" sizes="64px" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-3">¿Listo para jugar?</h2>
          <p className={`text-sm mb-6 max-w-md mx-auto ${t.muted}`}>
            Acepta el reglamento al participar. Entra con Google y empieza a pronosticar antes del pitazo.
          </p>
          <button
            type="button"
            onClick={goPlay}
            className="inline-flex items-center justify-center px-8 py-3.5 bg-berry-600 hover:bg-berry-500 text-white font-semibold rounded-xl shadow-lg shadow-berry-900/40 transition-all"
          >
            {session ? 'Ir a mi perfil' : 'Jugar con Google'}
          </button>
          <p className="mt-4">
            <Link href="/mundial" className="text-xs text-berry-400 hover:text-berry-300">
              Volver a la polla →
            </Link>
          </p>
        </div>
      </section>

      <footer className={`border-t py-8 text-center transition-colors ${t.footer}`}>
        <p className={`text-xs ${t.footerMuted}`}>© 2026 Arándano Café Bar · Pasto, Colombia</p>
      </footer>
    </div>
  )
}
