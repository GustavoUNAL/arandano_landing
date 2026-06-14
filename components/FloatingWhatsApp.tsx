'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function FloatingWhatsApp() {
  const router = useRouter()

  const goToMundialLanding = () => {
    router.push('/mundial')
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 pointer-events-none pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-3 sm:pr-4 md:bottom-6 md:right-6">
      <button
        type="button"
        onClick={goToMundialLanding}
        className="group relative flex flex-col items-end gap-1.5 max-w-[min(11.5rem,calc(100vw-1.5rem))] pointer-events-auto cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-berry-500 focus-visible:ring-offset-2 rounded-2xl"
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
  )
}
