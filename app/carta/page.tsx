'use client'

import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'

const categories = [
  { id: 'cafes', name: 'Cafetería', link: '/menu/cafes', highlight: true },
  { id: 'acompanantes', name: 'Panadería', link: '/menu/acompanantes', highlight: true },
  { id: 'combos', name: 'Combos', link: '/menu/combos', highlight: true },
  { id: 'cervezas', name: 'Cervezas', link: '/menu/cervezas', highlight: true },
  { id: 'bebidas', name: 'Bar (bebidas)', link: '/menu-bebidas', highlight: true },
  { id: 'cocteles', name: 'Cócteles', link: '/menu/cocteles', highlight: false },
  { id: 'shots', name: 'Shots', link: '/menu/shots', highlight: false }
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

            {/* Logo + Título centrados */}
            <div className="absolute top-10 sm:top-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 sm:gap-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                <Image
                  src="/images/logo.png"
                  alt="Arándano Café Bar"
                  fill
                  className="object-contain"
                  sizes="96px"
                  priority
                />
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-berry-600">
                Carta
              </h1>
              <p className="text-center text-berry-600 text-sm sm:text-base font-medium tracking-wide max-w-md">
                Menú Arándano Café Bar
              </p>
            </div>

            {/* Categorías - Derecha y centradas verticalmente */}
            <div className="flex justify-end mt-40 sm:mt-44 md:mt-48">
              <div className="space-y-5 sm:space-y-6 w-full max-w-xs text-right">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={category.link}
                    className={`carta-category-link block text-xl sm:text-2xl font-medium transition-all py-3 border-b border-transparent hover:border-berry-600 ${
                      category.highlight
                        ? 'text-berry-700 hover:text-berry-900 pl-4 border-l-4 border-berry-400'
                        : 'text-berry-600 hover:text-berry-800'
                    }`}
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

