'use client'

import Footer from '@/components/Footer'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import LocationSchedule from '@/components/LocationSchedule'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
        {/* Hero Section */}
        <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40">
                <Image
                  src="/images/logo.png"
                  alt="Arándano Café Bar Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 160px"
                  priority
                />
              </div>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-berry-950 mb-4 sm:mb-6">
              Arándano
              <span className="block text-berry-600">Café Bar</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-stone-700 mb-8 sm:mb-12 max-w-2xl mx-auto">
              Sabores artesanales, momentos únicos.
            </p>

            {/* Botones de Navegación */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center max-w-2xl mx-auto">
              <Link
                href="/carta"
                className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-berry-600 hover:bg-berry-700 text-white font-semibold text-lg sm:text-xl rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 11h14M5 11a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2M5 11v6a2 2 0 002 2h10a2 2 0 002-2v-6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
                </svg>
                <span>Carta</span>
              </Link>
              <Link
                href="/carrito"
                className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-white hover:bg-stone-50 text-berry-600 border-2 border-berry-600 font-semibold text-lg sm:text-xl rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 11h14M5 11a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2M5 11v6a2 2 0 002 2h10a2 2 0 002-2v-6M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
                </svg>
                <span>Carrito de Compras</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Ubicación y Mapa */}
        <LocationSchedule />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  )
}
