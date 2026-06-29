'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function FloatingWhatsApp() {
  const router = useRouter()

  const goToMundialLanding = () => {
    router.push('/mundial')
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={goToMundialLanding}
        className="group relative animate-balloon-float cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-berry-500 focus-visible:ring-offset-2 rounded-2xl"
        aria-label="Ir al Mundial — polla Arándano"
      >
        <div className="relative bg-gradient-to-r from-berry-600 to-berry-700 text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-xl shadow-berry-900/30 border border-berry-500/50 whitespace-nowrap transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
          <span>¡Gool!</span>
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-berry-700 border-r border-b border-berry-800/50 rotate-45 shadow-sm" />
        </div>
        <span className="absolute -inset-1 rounded-2xl bg-berry-500/20 blur-md animate-ping-slow pointer-events-none" />
      </button>

      <button
        type="button"
        onClick={goToMundialLanding}
        className="relative flex flex-col items-center justify-end cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-berry-400 focus-visible:ring-offset-2 rounded-full group transition-transform duration-300 hover:scale-105 active:scale-95"
        aria-label="Mundial 2026 — polla Arándano"
      >
        <div className="relative w-14 h-16 sm:w-16 sm:h-[4.5rem] flex items-end justify-center overflow-visible">
          <div className="animate-soccer-juggle relative w-12 h-12 sm:w-14 sm:h-14">
            <Image
              src="/soccer-ball.png"
              alt=""
              fill
              className="object-contain drop-shadow-lg"
              sizes="56px"
              priority
            />
          </div>
        </div>

        <div
          className="animate-soccer-shadow w-9 h-2 sm:w-10 sm:h-2.5 rounded-[50%] bg-black/25 blur-[2px] -mt-1"
          aria-hidden
        />
      </button>
    </div>
  )
}
