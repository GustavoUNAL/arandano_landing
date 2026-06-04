'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { MENU_ORDER_COMIDA_RAPIDA, sortMenuByIds } from '@/lib/menu-display-order'

interface Product {
  id: string
  name: string
  price: number
  description?: string
  category: string
  type: 'cafeteria' | 'bebida'
}

export default function MenuAcompanantes() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const allProducts = await response.json()
        const acompananteProducts = allProducts.filter((p: Product) => 
          p.type === 'cafeteria' && p.category === 'comida-rapida'
        )
        setProducts(acompananteProducts)
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const sortedProducts = useMemo(
    () => sortMenuByIds(products, MENU_ORDER_COMIDA_RAPIDA),
    [products]
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-6xl mx-auto w-full">
            <div className="relative min-h-[60vh] flex flex-col justify-center">
              {/* Botón de regreso - Izquierda arriba */}
              <div className="absolute top-4 sm:top-6 left-0">
                <Link
                  href="/carta"
                  className="inline-flex items-center gap-2 text-berry-600 hover:text-berry-800 font-medium transition-colors"
                >
                  <span>←</span>
                  <span>Volver</span>
                </Link>
              </div>

              {/* Título centrado + realce */}
              <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 text-center">
                <span className="inline-block text-xs sm:text-sm font-medium text-berry-500 uppercase tracking-wider mb-2">
                  Carta
                </span>
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-berry-600">
                  Comida rápida
                </h1>
              </div>

              {/* Productos - ancho completo en desktop, espacios ajustados */}
              <div className="mt-40 sm:mt-48 md:mt-52 w-full">
                <div className="space-y-4 sm:space-y-5 md:space-y-6 w-full">
                  {loading ? (
                    <div className="text-berry-600">Cargando...</div>
                  ) : (
                    sortedProducts.map((product, index) => (
                      <div key={product.id} className="w-full">
                        <div className="flex items-baseline justify-between gap-4 md:gap-12 lg:gap-20 w-full pb-3 sm:pb-4">
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-base sm:text-lg text-berry-600">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-xs sm:text-sm text-berry-500 mt-1 font-normal">
                                {product.description}
                              </div>
                            )}
                          </div>
                          <div className="text-lg sm:text-xl font-semibold text-berry-600 whitespace-nowrap shrink-0">
                            {formatPrice(product.price)}
                          </div>
                        </div>
                        {index < sortedProducts.length - 1 && (
                          <hr className="border-t border-berry-100 mt-2" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

