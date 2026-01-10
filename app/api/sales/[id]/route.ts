import { NextRequest, NextResponse } from 'next/server'
import { deleteSale, getSaleById, updateSale } from '@/lib/db-sales'
import { getProductById, updateProduct } from '@/lib/db-products'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { items, total, subtotal, discount, discountType, discountValue, comment, channel, paymentMethod, date, hour } = body

    // Obtener la venta original
    const originalSale = await getSaleById(params.id)
    
    if (!originalSale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Restaurar stock de productos originales
    for (const item of originalSale.items) {
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

    // Preparar datos de actualización
    const saleDate = date ? new Date(date) : new Date(originalSale.date)
    const saleHour = hour !== undefined ? hour : (originalSale.hour || saleDate.getHours())
    
    const updates: any = {
      date: saleDate.toISOString(),
      hour: saleHour,
      total: total !== undefined ? total : originalSale.total,
      subtotal: subtotal !== undefined ? subtotal : (total !== undefined ? total : originalSale.subtotal),
      discount: discount !== undefined ? discount : originalSale.discount,
      discountType: discountType !== undefined ? discountType : originalSale.discountType,
      discountValue: discountValue !== undefined ? discountValue : originalSale.discountValue,
      comment: comment !== undefined ? comment : originalSale.comment,
      channel: channel !== undefined ? channel : originalSale.channel,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : originalSale.paymentMethod,
    }

    // Si se proporcionan nuevos items, actualizarlos
    if (items && Array.isArray(items) && items.length > 0) {
      updates.items = items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      }))

      // Actualizar stock con los nuevos items
      const updateErrors: string[] = []
      for (const item of items) {
        try {
          const product = await getProductById(item.productId)
          if (product) {
            await updateProduct(item.productId, {
              stock: (product.stock || 0) - item.quantity,
              lastSaleDate: saleDate.toISOString(),
              totalSold: (product.totalSold || 0) + item.quantity
            })
          } else {
            updateErrors.push(`Producto ${item.productId} no encontrado`)
          }
        } catch (productError: any) {
          console.error(`[API] Error actualizando producto ${item.productId}:`, productError)
          updateErrors.push(`Error actualizando producto ${item.productId}: ${productError.message}`)
        }
      }

      if (updateErrors.length > 0) {
        console.warn('[API] Advertencias al actualizar productos:', updateErrors)
      }
    }

    // Actualizar la venta
    const updatedSale = await updateSale(params.id, updates)
    
    if (!updatedSale) {
      return NextResponse.json(
        { error: 'Error al actualizar la venta' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedSale)
  } catch (error: any) {
    console.error('[API] Error actualizando venta:', error)
    return NextResponse.json(
      { 
        error: 'Error al actualizar la venta',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

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

