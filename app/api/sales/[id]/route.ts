import { NextRequest, NextResponse } from 'next/server'
import { deleteSale, getSaleById } from '@/lib/db-sales'
import { getProductById, updateProduct } from '@/lib/db-products'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await getSaleById(params.id)
    
    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Restaurar stock de productos
    for (const item of sale.items) {
      const product = await getProductById(item.productId)
      if (product) {
        const newStock = product.stock + item.quantity
        const newTotalSold = Math.max(0, (product.totalSold || 0) - item.quantity)
        
        await updateProduct(item.productId, {
          stock: newStock,
          totalSold: newTotalSold
        })
      }
    }

    // Eliminar la venta
    const deleted = await deleteSale(params.id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Error al eliminar la venta' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sale:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la venta' },
      { status: 500 }
    )
  }
}

