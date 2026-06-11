'use client'

import { IconInfo, IconTarget, IconTrophy } from '@/components/sports/SportsIcons'
import {
  CONDICIONES_LEGALES,
  INITIAL_CREDITS,
  MIN_SETTLED_PICKS_TO_WIN,
  POINTS_CORRECT_RESULT,
  POINTS_EXACT_SCORE,
  POINTS_GOAL_DIFFERENCE,
  PREDICTION_COST,
  POLL_NAME,
  REGLAMENTO_SECTIONS,
  SCORING_EXAMPLES,
  TOP_WINNERS_COUNT,
} from '@/lib/polla-rules'
import { signIn, useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'

const TIER_STYLES = {
  emerald: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
  sky: 'border-sky-500/40 bg-sky-950/30 text-sky-300',
  amber: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
  stone: 'border-white/10 bg-white/5 text-stone-400',
} as const

export default function ReglamentoPage() {
  const { data: session } = useSession()

  const goPlay = () => {
    if (session) window.location.href = '/perfil'
    else signIn('google', { callbackUrl: '/perfil' })
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-stone-950/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/sports" className="text-sm text-berry-400 font-medium shrink-0">
            ← Polla
          </Link>
          <span className="font-display font-bold text-sm truncate">Reglamento</span>
          <button
            type="button"
            onClick={goPlay}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-berry-600 hover:bg-berry-500 shrink-0"
          >
            Jugar
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-berry-600/25 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-emerald-600/10 rounded-full blur-[80px]" />
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
              <p className="text-stone-400 text-base sm:text-lg leading-relaxed max-w-xl">
                Todo lo que necesitas saber para jugar limpio, sumar puntos y pelear por uno de los{' '}
                {TOP_WINNERS_COUNT} puestos del podio.
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
              sub: 'Saldo inicial virtual',
            },
            {
              icon: '🎯',
              title: `${POINTS_EXACT_SCORE} · ${POINTS_GOAL_DIFFERENCE} · ${POINTS_CORRECT_RESULT} pts`,
              sub: 'Exacto · Dif. · Resultado',
            },
            {
              icon: '🏆',
              title: `${TOP_WINNERS_COUNT} ganadores`,
              sub: `Mín. ${MIN_SETTLED_PICKS_TO_WIN} picks calificados`,
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-stone-900/90 backdrop-blur p-4 text-center shadow-xl"
            >
              <span className="text-2xl">{card.icon}</span>
              <p className="font-display font-bold text-berry-300 mt-2 text-sm sm:text-base">{card.title}</p>
              <p className="text-[10px] text-stone-500 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Galería ambiente */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-2xl overflow-hidden border border-white/10 h-40 sm:h-52">
          {[
            { src: '/images/showcase/coctel.png', alt: 'Ambiente Arándano' },
            { src: '/images/showcase/frappe.png', alt: 'Café Arándano' },
            { src: '/images/logo.png', alt: 'Arándano Café Bar' },
          ].map((img) => (
            <div key={img.src} className="relative bg-stone-900">
              <Image src={img.src} alt={img.alt} fill className="object-cover opacity-90" sizes="33vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 to-transparent" />
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-stone-500 mt-3">
          Vive el Mundial desde tu tercer espacio en Pasto · Arándano Café Bar
        </p>
      </section>

      {/* Ejemplos de puntuación */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-2 mb-6">
          <IconTarget className="w-5 h-5 text-berry-400" />
          <h2 className="font-display text-2xl font-bold">Ejemplos de puntuación</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {SCORING_EXAMPLES.map((ex) => (
            <div
              key={ex.label}
              className={`rounded-2xl border p-5 ${TIER_STYLES[ex.color]}`}
            >
              <p className="text-xs uppercase tracking-wide opacity-80 mb-3">{ex.label}</p>
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="text-center">
                  <p className="text-[10px] text-stone-500 mb-1">Tu pick</p>
                  <p className="font-display text-2xl font-bold tabular-nums">{ex.prediction}</p>
                </div>
                <span className="text-stone-600">→</span>
                <div className="text-center">
                  <p className="text-[10px] text-stone-500 mb-1">Real</p>
                  <p className="font-display text-2xl font-bold tabular-nums text-white">{ex.result}</p>
                </div>
              </div>
              <p className="text-center font-bold text-lg">
                {ex.points > 0 ? `+${ex.points} puntos` : '0 puntos'}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-500 mt-4 text-center">
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
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h3 className="font-semibold text-berry-300 mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-stone-300 leading-relaxed">
                    <span className="text-berry-500 shrink-0 mt-1">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Créditos explicados */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="rounded-2xl border border-berry-500/20 bg-gradient-to-br from-berry-950/50 to-stone-950 p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold mb-4">Créditos vs puntos</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-semibold text-berry-300 mb-2">Créditos virtuales</p>
              <ul className="space-y-2 text-stone-400">
                <li>· Empiezas con {INITIAL_CREDITS.toLocaleString('es-CO')} créditos.</li>
                <li>· Cada pronóstico nuevo cuesta {PREDICTION_COST} créditos.</li>
                <li>· Editar antes del pitazo es gratis.</li>
                <li>· No tienen valor en dinero real.</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-berry-300 mb-2">Puntos de ranking</p>
              <ul className="space-y-2 text-stone-400">
                <li>· Todos empiezan con 0 puntos.</li>
                <li>· Solo los ganas acertando resultados.</li>
                <li>· Definen tu posición en la tabla.</li>
                <li>· Los 5 primeros clasificados ganan el podio.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Condiciones legales */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <IconInfo className="w-5 h-5 text-stone-400" />
          <h2 className="font-display text-2xl font-bold">Condiciones y privacidad</h2>
        </div>
        <div className="space-y-4">
          {CONDICIONES_LEGALES.map((section) => (
            <article
              key={section.id}
              className="rounded-xl border border-white/5 bg-stone-900/50 p-5"
            >
              <h3 className="font-semibold text-stone-200 mb-3 text-sm">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="text-xs text-stone-500 leading-relaxed pl-3 border-l border-white/10">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-berry-950/30 py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image src="/images/logo.png" alt="Arándano" fill className="object-contain" sizes="64px" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-3">¿Listo para jugar?</h2>
          <p className="text-stone-400 text-sm mb-6 max-w-md mx-auto">
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
            <Link href="/sports" className="text-xs text-berry-400 hover:text-berry-300">
              Volver a la polla →
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center">
        <p className="text-stone-600 text-xs">© 2026 Arándano Café Bar · Pasto, Colombia</p>
      </footer>
    </div>
  )
}
