'use client'

import Footer from '@/components/Footer'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  icon: string
  description: string
  link: string
  type: 'cafeteria' | 'bebida'
}

const CATEGORIES: Category[] = [
  // Cafetería
  {
    id: 'cafe-caliente',
    name: 'Cafés Calientes',
    icon: '☕',
    description: 'Cafés artesanales calientes',
    link: '/menu-cafes',
    type: 'cafeteria'
  },
  {
    id: 'cafe-frio',
    name: 'Cafés Fríos',
    icon: '🧊',
    description: 'Cafés artesanales fríos',
    link: '/menu-cafes',
    type: 'cafeteria'
  },
  {
    id: 'pasteleria',
    name: 'Pastelería',
    icon: '🍰',
    description: 'Pasteles y acompañantes',
    link: '/menu-cafes',
    type: 'cafeteria'
  },
  {
    id: 'combo',
    name: 'Combos',
    icon: '✨',
    description: 'Combos especiales',
    link: '/menu-cafes',
    type: 'cafeteria'
  },
  // Bebidas
  {
    id: 'cerveza',
    name: 'Cervezas',
    icon: '🍺',
    description: 'Cervezas nacionales e importadas',
    link: '/menu-bebidas',
    type: 'bebida'
  },
  {
    id: 'coctel',
    name: 'Cócteles',
    icon: '🍸',
    description: 'Cócteles especiales',
    link: '/menu-bebidas',
    type: 'bebida'
  },
  {
    id: 'vino',
    name: 'Vinos',
    icon: '🍷',
    description: 'Vinos seleccionados',
    link: '/menu-bebidas',
    type: 'bebida'
  },
  {
    id: 'licores',
    name: 'Licores',
    icon: '🥃',
    description: 'Vodka, Ginebra, Tequila, Whisky',
    link: '/menu-bebidas',
    type: 'bebida'
  }
]

export default function CartaPage() {
  const categoriasCafeteria = CATEGORIES.filter(cat => cat.type === 'cafeteria')
  const categoriasBebidas = CATEGORIES.filter(cat => cat.type === 'bebida')

  return (
    <>
      <main className="min-h-screen bg-white pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-berry-950 mb-4">
              La Carta
            </h1>
            <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto">
              Explora nuestro menú completo de café artesanal y bebidas
            </p>
          </div>

          {/* Botón de regreso */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-berry-600 hover:text-berry-800 font-medium transition-colors"
            >
              <span>←</span>
              <span>Volver al inicio</span>
            </Link>
          </div>

          {/* Cafetería */}
          <section className="mb-16 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-berry-950 mb-6 sm:mb-8 flex items-center gap-3">
              <span>☕</span>
              <span>Cafetería</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {categoriasCafeteria.map((category) => (
                <Link
                  key={category.id}
                  href={category.link}
                  className="group bg-stone-50 hover:bg-berry-50 border-2 border-stone-200 hover:border-berry-300 rounded-xl p-6 sm:p-8 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-center">
                    <div className="text-5xl sm:text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                    <h3 className="font-semibold text-lg sm:text-xl text-berry-950 mb-2">
                      {category.name}
                    </h3>
                    <p className="text-sm sm:text-base text-stone-600">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Separador */}
          <div className="my-12 sm:my-16 flex items-center justify-center">
            <div className="flex items-center gap-4 w-full max-w-md">
              <div className="flex-1 h-px bg-stone-300"></div>
              <div className="text-2xl">🍹</div>
              <div className="flex-1 h-px bg-stone-300"></div>
            </div>
          </div>

          {/* Bebidas */}
          <section className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-berry-950 mb-6 sm:mb-8 flex items-center gap-3">
              <span>🍹</span>
              <span>Bebidas</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {categoriasBebidas.map((category) => (
                <Link
                  key={category.id}
                  href={category.link}
                  className="group bg-stone-50 hover:bg-berry-50 border-2 border-stone-200 hover:border-berry-300 rounded-xl p-6 sm:p-8 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-center">
                    <div className="text-5xl sm:text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {category.icon}
                    </div>
                    <h3 className="font-semibold text-lg sm:text-xl text-berry-950 mb-2">
                      {category.name}
                    </h3>
                    <p className="text-sm sm:text-base text-stone-600">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Aviso Legal */}
          <div className="mt-12 sm:mt-16 bg-amber-50 border-2 border-amber-200 rounded-xl p-6 sm:p-8">
            <p className="text-amber-800 text-sm sm:text-base text-center font-medium">
              <strong>Importante:</strong> Prohibida la venta de bebidas alcohólicas a menores de edad.
              Se solicita documento de identidad al momento de la entrega.
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  )
}

