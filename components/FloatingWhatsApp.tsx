'use client'

import PollaNotificationCenter from '@/components/sports/PollaNotificationCenter'
import type { MatchPrediction } from '@/lib/sports-polla-shared'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'

interface SportsMePayload {
  matches: Array<{
    id: number
    utcDate: string
    homeTeam: { shortName: string; name: string; tla: string }
    awayTeam: { shortName: string; name: string; tla: string }
    isFinished: boolean
    canPredict: boolean
    prediction: MatchPrediction | null
    startsIn: string
    formattedDate: string
  }>
  watchMatches?: SportsMePayload['matches']
  predictions: MatchPrediction[]
}

function BellButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="relative flex items-center justify-center w-11 h-11 sm:w-10 sm:h-10 rounded-full border border-stone-200 bg-white/95 text-stone-600 shadow-lg hover:bg-stone-50 hover:text-stone-900 transition-colors"
      aria-label="Notificaciones de la polla — iniciar sesión"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

export default function FloatingWhatsApp() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [sportsData, setSportsData] = useState<SportsMePayload | null>(null)

  useEffect(() => {
    if (!session) {
      setSportsData(null)
      return
    }
    let cancelled = false
    fetch('/api/sports/me')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && !json.error) setSportsData(json)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [session])

  const notificationMatches = useMemo(() => {
    if (!sportsData) return []
    const watch = sportsData.watchMatches ?? []
    return [...new Map([...sportsData.matches, ...watch].map((m) => [m.id, m] as const)).values()]
  }, [sportsData])

  const goToMundialLanding = () => {
    router.push('/mundial')
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none pb-[max(0.75rem,env(safe-area-inset-bottom))] px-3 sm:px-4 md:bottom-6 md:px-6">
      <div className="mx-auto flex max-w-lg sm:max-w-2xl items-end justify-between gap-2 pointer-events-auto">
        {/* Campana — izquierda en móvil */}
        <div className="shrink-0">
          {status === 'loading' ? (
            <div className="w-11 h-11 rounded-full bg-white/80 border border-stone-200 shadow-lg animate-pulse" />
          ) : session && sportsData ? (
            <PollaNotificationCenter
              matches={notificationMatches}
              predictions={sportsData.predictions}
              isDark={false}
              panelAlign="left"
              panelPlacement="above"
              size="comfortable"
              onPlayMatch={(matchId) => router.push(`/perfil?tab=jugar&match=${matchId}`)}
            />
          ) : (
            <BellButton href="/perfil" />
          )}
        </div>

        {/* Balón + CTA — derecha */}
        <button
          type="button"
          onClick={goToMundialLanding}
          className="group relative flex flex-col items-end gap-1.5 max-w-[min(11.5rem,calc(100vw-5rem))] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-berry-500 focus-visible:ring-offset-2 rounded-2xl"
          aria-label="Click para jugar la polla mundialista"
        >
          <div className="relative animate-balloon-float">
            <div className="relative bg-gradient-to-r from-berry-600 to-berry-700 text-white font-semibold px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl shadow-xl shadow-berry-900/30 border border-berry-500/50 transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
              <span className="block text-[10px] sm:text-sm leading-snug text-center">
                Click para jugar la polla mundialista
              </span>
              <div className="absolute -bottom-2 right-5 sm:right-6 w-3.5 h-3.5 bg-berry-700 border-r border-b border-berry-800/50 rotate-45 shadow-sm" />
            </div>
            <span className="absolute -inset-1 rounded-2xl bg-berry-500/20 blur-md animate-ping-slow pointer-events-none" />
          </div>

          <div className="flex flex-col items-center justify-end">
            <div className="animate-soccer-juggle relative rounded-full bg-white p-2 sm:p-2.5 shadow-lg border border-stone-200/90 ring-2 ring-white">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                <Image
                  src="/soccer-ball.png"
                  alt=""
                  fill
                  className="object-contain"
                  sizes="48px"
                  priority
                />
              </div>
            </div>
            <div
              className="animate-soccer-shadow w-9 h-2 sm:w-10 sm:h-2.5 rounded-[50%] bg-black/20 blur-[2px] mt-1"
              aria-hidden
            />
          </div>
        </button>
      </div>
    </div>
  )
}
