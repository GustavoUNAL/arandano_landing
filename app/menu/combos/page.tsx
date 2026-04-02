'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MENU_ORDER_COMBO_DIA,
  MENU_ORDER_COMBO_FIJO,
  sortMenuByIds
} from '@/lib/menu-display-order'

interface Product {
  id: string
  name: string
  price: number
  description?: string
  category: string
  type: 'cafeteria' | 'bebida'
}

export default function MenuCombosPage () {
  const [combosFijos, setCombosFijos] = useState<Product[]>([])
  const [combosDia, setCombosDia] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/products')
        const all: Product[] = await response.json()
        setCombosFijos(
          sortMenuByIds(
            all.filter((p) => p.category === 'combo'),
            MENU_ORDER_COMBO_FIJO
          )
        )
        setCombosDia(
          sortMenuByIds(
            all.filter((p) => p.category === 'combo-dia'),
            MENU_ORDER_COMBO_DIA
          )
        )
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)

  const priceCell = (product: Product) =>
    product.id === 'combo-dia-sabado' && product.price === 0 ? (
      <span className="text-berry-500">—</span>
    ) : (
      <>${formatPrice(product.price)}</>
    )

  const renderList = (items: Product[]) =>
    items.map((product, index) => (
      <div key={product.id} className="w-full">
        <div className="flex items-baseline justify-between gap-4 md:gap-12 lg:gap-20 w-full pb-3 sm:pb-4">
          <div className="flex-1 min-w-0 text-left">
            <div className="font-medium text-base sm:text-lg text-berry-600">
              {product.name}
            </div>
            {product.description ? (
              <div className="text-xs sm:text-sm text-berry-500 mt-1 font-normal">
                {product.description}
              </div>
            ) : null}
          </div>
          <div className="text-lg sm:text-xl font-semibold text-berry-600 whitespace-nowrap shrink-0">
            {priceCell(product)}
          </div>
        </div>
        {index < items.length - 1 && (
          <hr className="border-t border-berry-100 mt-2" />
        )}
      </div>
    ))

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1 px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="relative min-h-[60vh] flex flex-col justify-center">
            <div className="absolute top-4 sm:top-6 left-0">
              <Link
                href="/carta"
                className="inline-flex items-center gap-2 text-berry-600 hover:text-berry-800 font-medium transition-colors"
              >
                <span>←</span>
                <span>Volver</span>
              </Link>
            </div>

            <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 text-center">
              <span className="inline-block text-xs sm:text-sm font-medium text-berry-500 uppercase tracking-wider mb-2">
                Menú
              </span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-berry-600">
                Combos
              </h1>
            </div>

            <div className="mt-40 sm:mt-48 md:mt-52 w-full space-y-10 sm:space-y-12">
              {loading ? (
                <div className="text-berry-600">Cargando...</div>
              ) : (
                <>
                  {combosFijos.length > 0 && (
                    <section>
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-berry-700 mb-6">
                        Combos
                      </h2>
                      <div className="space-y-4 sm:space-y-5 md:space-y-6 w-full">
                        {renderList(combosFijos)}
                      </div>
                    </section>
                  )}
                  {combosDia.length > 0 && (
                    <section>
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-berry-700 mb-6">
                        Combos del día
                      </h2>
                      <div className="space-y-4 sm:space-y-5 md:space-y-6 w-full">
                        {renderList(combosDia)}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
