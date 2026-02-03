import { NextRequest, NextResponse } from 'next/server'
import { getProductById } from '@/lib/db-products'
import { getProductStockDetail } from '@/lib/stock-service'

/**
 * GET /api/products/[id]/stock-detail
 * Stock detallado del producto: total y desglose por ítem de inventario enlazado
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await getProductById(id)
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    const detail = await getProductStockDetail(product)
    return NextResponse.json(detail)
  } catch (error) {
    console.error('[API] Error obteniendo stock detallado:', error)
    return NextResponse.json(
      { error: 'Error al obtener stock detallado' },
      { status: 500 }
    )
  }
}
