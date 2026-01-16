'use client'

import Footer from '@/components/Footer'
import Link from 'next/link'

const categories = [
  {
    id: 'cafes',
    name: 'Cafés',
    link: '/menu/cafes'
  },
  {
    id: 'cocteles',
    name: 'Cocteles',
    link: '/menu/cocteles'
  },
  {
    id: 'acompanantes',
    name: 'Acompañantes',
    link: '/menu/acompanantes'
  },
  {
    id: 'cervezas',
    name: 'Cervezas',
    link: '/menu/cervezas'
  },
  {
    id: 'shots',
    name: 'Shots',
    link: '/menu/shots'
  }
]

export default function CartaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-white px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="relative min-h-[60vh] flex flex-col justify-center">
            {/* Botón de regreso - Izquierda arriba */}
            <div className="absolute top-0 left-0">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-berry-600 hover:text-berry-800 font-medium transition-colors"
              >
                <span>←</span>
                <span>Volver al inicio</span>
              </Link>
            </div>

            {/* Título centrado */}
            <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-berry-600">
                Carta
              </h1>
            </div>

            {/* Categorías - Derecha y centradas verticalmente */}
            <div className="flex justify-end mt-20 sm:mt-24 md:mt-28">
              <div className="space-y-5 sm:space-y-6 w-full max-w-xs text-right">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={category.link}
                    className="carta-category-link block text-xl sm:text-2xl text-berry-600 hover:text-berry-800 font-medium transition-all py-3 border-b border-transparent hover:border-berry-600"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

