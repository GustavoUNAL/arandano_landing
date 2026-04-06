'use client'

import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

type MenuItem = {
  name: string
  description: string
  price: number
}

type MenuSection = {
  id: string
  title: string
  items: MenuItem[]
}

const sections: MenuSection[] = [
  {
    id: 'cafeteria',
    title: '☕ CAFETERÍA',
    items: [
      { name: 'Aromática con fruta', description: '6 oz de agua con aromáticas y fruta', price: 7000 },
      { name: 'Soda italiana', description: '12 oz soda con sirope, limón y opcional sal o picante', price: 10000 },
      { name: 'Vaso de leche', description: '8 oz de leche de vaca', price: 5000 },
      { name: 'Affogato', description: '2 oz espresso con helado de vainilla', price: 10000 },
      { name: 'Café irlandés', description: '3 oz café + 2 oz whisky + 2 oz leche', price: 17000 },
      { name: 'Café aromatizado', description: '6 oz de Café Nariñense con canela o vainilla', price: 5000 },
      { name: 'Aromática', description: '6 oz de agua con aromáticas', price: 3000 },
      { name: 'Leche achocolatada', description: '6 oz leche con chocolate en polvo', price: 5000 },
      { name: 'Jarra de aromática con fruta', description: '1 litro de aromática', price: 10000 },
      { name: 'Café con leche', description: '6 oz de Café Nariñense con leche', price: 5000 },
      { name: 'Café negro artesanal', description: '6 oz de Café Nariñense preparado al momento de servir', price: 4000 },
      { name: 'Carajillo', description: '4 oz de café con 2 oz de aguardiente', price: 8000 },
      { name: 'Café frapé', description: '6 oz café frío granizado con leche', price: 8000 },
    ],
  },
  {
    id: 'bar',
    title: '🍺 BAR',
    items: [
      { name: 'Cerveza Poker', description: 'cerveza nacional', price: 3500 },
      { name: 'Cerveza Coronita', description: 'cerveza importada rubia', price: 3500 },
      { name: 'Cerveza Pokeron', description: 'cerveza nacional rubia', price: 6000 },
      { name: 'Cerveza Club Colombia', description: 'cerveza nacional rubia o roja', price: 4000 },
      { name: 'Cerveza Michelada', description: 'cerveza con limón, sal o picante', price: 7000 },
      { name: 'Cerveza Budweiser', description: 'cerveza importada rubia', price: 3500 },
    ],
  },
  {
    id: 'cocteles',
    title: '🍹 CÓCTELES',
    items: [
      { name: 'Hervidos', description: '12 oz de coctel de frutas cítricas con 2 oz licor artesanal', price: 7000 },
      { name: 'Jarra de hervidos', description: '1 litro de cóctel de frutas cítricas calientes con 10 oz de licor artesanal', price: 25000 },
      { name: 'Cóctel arándano', description: '12 oz granizado de arándano con 2 oz ginebra', price: 15000 },
      { name: 'Margarita', description: '10 oz mezcla de limón con 2 oz tequila', price: 15000 },
      { name: 'Piña colada', description: '12 oz crema de coco y piña con 2 oz ron', price: 15000 },
      { name: 'Negroni', description: '12 oz soda con 2 oz Campari y naranja', price: 15000 },
      { name: 'Moscow mule', description: '12 oz ginger beer con 2 oz vodka', price: 15000 },
      { name: 'Gin Tonic', description: '12 oz tónica con 2 oz ginebra', price: 15000 },
      { name: 'Whisky en las rocas', description: '2 oz whisky con hielo', price: 22000 },
    ],
  },
  {
    id: 'shots',
    title: '🥃 SHOTS',
    items: [
      { name: 'Shot Vodka', description: '1 oz vodka con limón y sal o ají', price: 6000 },
      { name: 'Shot Tequila', description: '1 oz tequila con limón y sal', price: 8000 },
      { name: 'Shot Brandy', description: '1 oz brandy con cereza', price: 5000 },
      { name: 'Shot Aguardiente', description: '1 oz aguardiente con limón y sal o ají', price: 6000 },
      { name: 'Shot Whisky', description: '1 oz whisky solo o con limón', price: 12000 },
      { name: 'Shot Ginebra', description: '1 oz ginebra con aceituna o limón', price: 7000 },
      { name: 'Shot Ron', description: '1 oz ron con limón o cereza', price: 5000 },
    ],
  },
  {
    id: 'botellas',
    title: '🍾 BOTELLAS',
    items: [
      { name: 'Aguardiente Nariño o Amarillo', description: '750 ml aguardiente tradicional', price: 65000 },
      { name: 'Ginebra Gordon’s', description: '750 ml ginebra clásica', price: 95000 },
      { name: 'Tequila Olmeca', description: '750 ml tequila joven', price: 110000 },
      { name: 'Whisky Old Parr', description: '750 ml whisky escocés', price: 170000 },
      { name: 'Vino tinto', description: '750 ml vino tinto', price: 65000 },
      { name: 'Vodka Smirnoff Tamarindo', description: '750 ml vodka sabor tamarindo', price: 70000 },
    ],
  },
  {
    id: 'comida',
    title: '🍴 COMIDA',
    items: [
      { name: 'Porción de galletas', description: '3 galletas artesanales', price: 5000 },
      { name: 'Empanadas', description: '1 empanada de carne o pollo', price: 3500 },
      { name: 'Tostadas', description: '1 tostada integral con mantequilla o mermelada', price: 2000 },
      { name: 'Hot Dog', description: 'Pan suave con salchicha premium, queso, papa triturada, salsas y jalapeños.', price: 11000 },
      { name: 'Hot Dog en combo', description: '1 Hot Dog con vaso de gaseosa y papas chips', price: 15000 },
    ],
  },
  {
    id: 'combos',
    title: '🎯 COMBOS',
    items: [
      { name: 'Combo Lunes Micheladas', description: '2 cervezas micheladas (limón, sal o picante)', price: 13000 },
      { name: 'Combo Martes Café', description: 'Café negro + 2 tostadas con mantequilla o mermelada', price: 6500 },
      { name: 'Combo Miércoles Jarra', description: 'Jarra de hervido (1 litro de cóctel caliente con licor)', price: 20000 },
      { name: 'Combo Jueves Hervidos', description: '2 hervidos (cóctel caliente de frutas con licor)', price: 12000 },
      { name: 'Combo Viernes Shots', description: '3 shots (aguardiente, ron o brandy)', price: 13000 },
      { name: 'Combo Viernes Moscow Mule', description: '2 cócteles Moscow Mule (vodka + ginger beer)', price: 25000 },
      { name: 'Combo Sábado Frappé', description: 'Café frappé + 1 galleta artesanal', price: 9500 },
    ],
  },
]

function formatCOP(value: number) {
  return `$${value.toLocaleString('es-CO')}`
}

export default function CartaPage() {
  const [mobileCategory, setMobileCategory] = useState<string>('')

  const mobileOptions = useMemo(
    () => sections.map((s) => ({ id: s.id, title: s.title })),
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash?.replace('#', '').trim()
    if (hash && sections.some((s) => s.id === hash)) {
      setMobileCategory(hash)
    }
  }, [])

  const handleMobileCategoryChange = (nextId: string) => {
    setMobileCategory(nextId)
    if (typeof window !== 'undefined') {
      window.location.hash = nextId
      const el = document.getElementById(nextId)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-stone-50">
        <div className="container-custom py-6 sm:py-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between gap-4 mb-6 sm:mb-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-berry-700 hover:text-berry-950 font-medium transition-colors"
              >
                <span aria-hidden>←</span>
                <span>Volver</span>
              </Link>

              <div className="flex flex-col items-center flex-1">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                  <Image
                    src="/images/logo.png"
                    alt="Arándano Café Bar"
                    fill
                    className="object-contain"
                    sizes="64px"
                    priority
                  />
                </div>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-berry-950 mt-2">
                  Carta
                </h1>
                <p className="text-berry-700 text-sm sm:text-base text-center mt-1">
                  Menú Arándano Café Bar
                </p>
              </div>

              <div className="w-[64px] sm:w-[80px]" aria-hidden />
            </div>

            {/* Mobile: dropdown */}
            <div className="sm:hidden mb-6">
              <label className="sr-only">Categorías</label>
              <div className="relative">
                <select
                  value={mobileCategory}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) return
                    handleMobileCategoryChange(v)
                  }}
                  className="w-full appearance-none bg-white/70 border border-stone-200/70 rounded-lg px-3 py-2 pr-9 text-xs font-semibold text-berry-900 leading-tight focus:outline-none focus:ring-2 focus:ring-berry-200 focus:border-berry-300"
                >
                  <option value="" disabled>
                    Busca por categoría
                  </option>
                  {mobileOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-berry-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tablet/Desktop: chips */}
            <nav className="hidden sm:flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-10">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="px-3 py-2 rounded-full bg-white border border-stone-200 text-berry-800 text-sm font-semibold hover:border-berry-300 hover:bg-stone-50 transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </nav>

            <div className="space-y-6 sm:space-y-8">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="bg-white border-2 border-stone-200 rounded-2xl overflow-hidden"
                >
                  <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-berry-50 to-white border-b border-stone-200">
                    <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-berry-950">
                      {section.title}
                    </h2>
                    <div className="mt-3 hidden sm:grid grid-cols-12 gap-3 text-xs font-semibold text-berry-700">
                      <div className="col-span-4">Nombre</div>
                      <div className="col-span-6">Descripción</div>
                      <div className="col-span-2 text-right">Precio</div>
                    </div>
                  </div>

                  <div className="divide-y divide-stone-200">
                    {section.items.map((item) => (
                      <div key={`${section.id}-${item.name}`} className="px-4 sm:px-6 py-4">
                        {/* Desktop/tablet row */}
                        <div className="hidden sm:grid grid-cols-12 gap-3 items-start">
                          <div className="col-span-4 font-semibold text-berry-950 leading-snug">
                            {item.name}
                          </div>
                          <div className="col-span-6 text-berry-700 text-sm leading-relaxed">
                            {item.description}
                          </div>
                          <div className="col-span-2 text-right font-bold text-berry-950">
                            {formatCOP(item.price)}
                          </div>
                        </div>

                        {/* Mobile row */}
                        <div className="sm:hidden">
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-semibold text-berry-950 leading-snug">
                              {item.name}
                            </div>
                            <div className="font-bold text-berry-950 whitespace-nowrap">
                              {formatCOP(item.price)}
                            </div>
                          </div>
                          <div className="mt-1 text-berry-700 text-sm leading-relaxed">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

