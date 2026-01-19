import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/db-products'
import { getProducts as getProductsJSON } from '@/lib/products'
import { getProductsWithStock, getProductStockInfo } from '@/lib/stock-service'

/**
 * GET /api/products/stock
 * Obtiene información de stock para todos los productos o un producto específico
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    if (productId) {
      // Obtener stock para un producto específico
      const products = await getProducts()
      const product = products.find(p => p.id === productId)
      
      if (!product) {
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        )
      }
      
      const stockInfo = await getProductStockInfo(product)
      return NextResponse.json(stockInfo)
    } else {
      // Obtener stock para todos los productos (optimizado con límite y procesamiento en lotes)
      try {
        const products = await getProducts()
        
        // Limitar a productos que realmente necesitan cálculo de stock (con recetas o sin stock directo)
        // Para mejorar rendimiento, solo calcular stock detallado para productos que lo necesitan
        const productsWithStock: any[] = []
        
        // Procesar en lotes de 10 para evitar sobrecargar Firebase
        const batchSize = 10
        for (let i = 0; i < products.length; i += batchSize) {
          const batch = products.slice(i, i + batchSize)
          
          await Promise.allSettled(
            batch.map(async (product) => {
              try {
                const stockInfo = await getProductStockInfo(product)
                productsWithStock.push(stockInfo)
              } catch (productError: any) {
                // Si falla un producto, usar stock básico
                console.warn(`[API] Error obteniendo stock para producto ${product?.id}:`, productError.message)
                productsWithStock.push({
                  product: product,
                  stock: product?.stock || 0,
                  hasDirectStock: true,
                  hasRecipe: false
                })
              }
            })
          )
          
          // Pequeña pausa entre lotes para no sobrecargar Firebase
          if (i + batchSize < products.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
        
        return NextResponse.json(productsWithStock)
      } catch (error: any) {
        // Si falla completamente, intentar fallback a JSON
        console.error('[API] Error calculando stock, intentando fallback:', error.message)
        const errorMessage = error?.message || ''
        
        // Si es un error de cuota de Firebase, usar JSON como fallback
        if (errorMessage.includes('Quota exceeded') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          console.warn('[API] Firebase quota exceeded - usando fallback JSON')
          try {
            const products = getProductsJSON()
            const productsWithBasicStock = products.map(product => ({
              product,
              stock: product.stock || 0,
              hasDirectStock: true,
              hasRecipe: false
            }))
            return NextResponse.json(productsWithBasicStock)
          } catch (fallbackError) {
            // Si también falla el fallback, retornar error
            return NextResponse.json(
              { 
                error: 'Cuota de Firebase excedida. Por favor, espera unos minutos.',
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
              },
              { status: 503 }
            )
          }
        }
        
        // Para otros errores, retornar productos con stock básico desde Firebase (que ya falló)
        // o intentar JSON como último recurso
        try {
          const products = getProductsJSON()
          const productsWithBasicStock = products.map(product => ({
            product,
            stock: product.stock || 0,
            hasDirectStock: true,
            hasRecipe: false
          }))
          return NextResponse.json(productsWithBasicStock)
        } catch (fallbackError) {
          return NextResponse.json(
            { 
              error: 'Error al obtener stock',
              details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            },
            { status: 500 }
          )
        }
      }
    }
  } catch (error: any) {
    console.error('[API] Error obteniendo stock:', error)
    const errorMessage = error?.message || ''
    
    // Si es un error de cuota de Firebase, usar JSON como fallback
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.warn('[API] Firebase quota exceeded - usando fallback JSON')
      try {
        const products = getProductsJSON()
        const productsWithBasicStock = products.map(product => ({
          product,
          stock: product.stock || 0,
          hasDirectStock: true,
          hasRecipe: false
        }))
        return NextResponse.json(productsWithBasicStock)
      } catch (fallbackError) {
        return NextResponse.json(
          { 
            error: 'Cuota de Firebase excedida. Por favor, espera unos minutos.',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Error al obtener stock',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
