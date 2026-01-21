import { NextRequest, NextResponse } from 'next/server'
import { getStockMovementsByInventoryItem } from '@/lib/db-stock-movements'

export const dynamic = 'force-dynamic'

/**
 * GET /api/inventory/[id]/stock
 * Obtiene los movimientos de stock y estadísticas para un item de inventario
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const movements = await getStockMovementsByInventoryItem(id)
    
    // Calcular cantidad consumida (suma de movimientos negativos)
    const consumedQuantity = movements
      .filter(m => m.quantity < 0)
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
    
    // Calcular cantidad agregada (suma de movimientos positivos)
    const addedQuantity = movements
      .filter(m => m.quantity > 0)
      .reduce((sum, m) => sum + m.quantity, 0)
    
    return NextResponse.json({
      movements,
      consumedQuantity,
      addedQuantity,
      totalMovements: movements.length
    })
  } catch (error: any) {
    console.error('Error obteniendo movimientos de stock:', error)
    return NextResponse.json(
      { 
        error: 'Error al obtener movimientos de stock',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
