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
      // Obtener stock para todos los productos (con manejo de errores para evitar exceder cuotas)
      try {
        const products = await getProducts()
        
        // Calcular stock en lotes pequeños para evitar exceder cuotas
        const productsWithStock: any[] = []
        
        for (let i = 0; i < products.length; i++) {
          try {
            const product = products[i]
            const stockInfo = await getProductStockInfo(product)
            productsWithStock.push(stockInfo)
          } catch (productError: any) {
            // Si falla un producto, continuar con los demás
            console.error(`[API] Error obteniendo stock para producto ${products[i]?.id}:`, productError.message)
            // Agregar producto con stock básico si falla
            productsWithStock.push({
              product: products[i],
              stock: products[i]?.stock || 0,
              hasDirectStock: true,
              hasRecipe: false
            })
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
