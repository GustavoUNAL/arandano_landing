'use client'

import Footer from '@/components/Footer'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import BotanicalBackground from '@/components/BotanicalBackground'
import LocationSchedule from '@/components/LocationSchedule'
import ProductShowcaseCarousel from '@/components/ProductShowcaseCarousel'
import ScrollReveal from '@/components/ScrollReveal'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-stone-50 via-stone-50/95 to-stone-100 pb-28 sm:pb-32">
        <BotanicalBackground />
        <div className="relative z-10">
        {/* Hero */}
        <section
          id="inicio"
          className="flex flex-col justify-center px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8 sm:pb-10"
        >
          <ScrollReveal eager className="max-w-4xl mx-auto w-full text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                <Image
                  src="/images/logo.png"
                  alt="Arándano Café Bar Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 144px"
                  priority
                />
              </div>
            </div>
            <h1 className="font-display text-[1.85rem] leading-tight sm:text-5xl md:text-6xl lg:text-7xl font-bold text-berry-950 mb-3 sm:mb-5 px-1">
              Arándano
              <span className="block text-berry-600 mt-0.5">Café Bar</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-stone-700 mb-6 sm:mb-8 max-w-2xl mx-auto leading-snug px-2">
              Tu tercer espacio
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-5 justify-center items-stretch sm:items-center max-w-md sm:max-w-2xl mx-auto w-full px-1">
              <Link
                href="/carta"
                className="w-full min-h-[48px] sm:min-h-[52px] px-6 sm:px-10 py-3.5 sm:py-4 bg-berry-600 hover:bg-berry-700 active:bg-berry-800 text-white font-semibold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 11h14M5 11a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2M5 11v6a2 2 0 002 2h10a2 2 0 002-2v-6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"
                  />
                </svg>
                <span>Carta</span>
              </Link>
              <Link
                href="/carrito"
                className="w-full min-h-[48px] sm:min-h-[52px] px-6 sm:px-10 py-3.5 sm:py-4 bg-white hover:bg-stone-50 active:bg-stone-100 text-berry-600 border-2 border-berry-600 font-semibold text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 11h14M5 11a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2M5 11v6a2 2 0 002 2h10a2 2 0 002-2v-6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"
                  />
                </svg>
                <span className="sm:hidden">Carrito</span>
                <span className="hidden sm:inline">Carrito de Compras</span>
              </Link>
            </div>
          </ScrollReveal>
        </section>

        {/* Productos destacados */}
        <section
          id="ambiente"
          className="home-section border-t border-berry-200/30 bg-gradient-to-b from-berry-50/40 via-white to-stone-50/80 px-4 sm:px-6"
          aria-label="Productos destacados"
        >
          <ScrollReveal delay={60}>
            <div className="max-w-5xl mx-auto text-center mb-6 sm:mb-8">
              <span className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-berry-600 mb-2">
                Lo que pedimos hoy
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-berry-950">
                Nuestros productos
              </h2>
              <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-lg mx-auto">
                Elige, agrega al pedido y envíalo por WhatsApp en segundos.
              </p>
            </div>
            <ProductShowcaseCarousel />
          </ScrollReveal>
        </section>

        {/* Ubicación + mapa (una sola tarjeta) */}
        <section
          id="ubicacion"
          className="home-section border-t border-stone-200/40 px-4 sm:px-6"
          aria-label="Ubicación"
        >
          <LocationSchedule />
        </section>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  )
}
