import { NextRequest, NextResponse } from 'next/server'
import { deleteSale, getSaleById, updateSale } from '@/lib/db-sales'
import { getProductById, updateProduct } from '@/lib/db-products'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { items, total, subtotal, discount, discountType, discountValue, comment, channel, paymentMethod, date, hour } = body

    // Obtener la venta original
    const originalSale = await getSaleById(id)
    
    if (!originalSale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    // Guardar fecha como YYYY-MM-DD y hora 0-23 (igual que POST) para que el día no cambie por zona horaria
    let dateToStore: string
    let saleHour: number

    if (date !== undefined && date !== null && date !== '') {
      const isDateOnly = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
      if (isDateOnly) {
        dateToStore = date
      } else if (typeof date === 'string' && date.length >= 10) {
        // Si viene ISO o con hora, usar la parte de fecha en local para que coincida con el calendario
        const datePart = date.slice(0, 10)
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          dateToStore = datePart
        } else {
          const d = new Date(date)
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          dateToStore = `${y}-${m}-${day}`
        }
      } else {
        dateToStore = typeof originalSale.date === 'string' && originalSale.date.length >= 10
          ? originalSale.date.slice(0, 10)
          : new Date(originalSale.date).toISOString().split('T')[0]
      }
      saleHour = hour !== undefined && hour !== null ? Number(hour) : (typeof originalSale.hour === 'number' ? originalSale.hour : (typeof originalSale.date === 'string' && originalSale.date.length >= 10 ? 0 : new Date(originalSale.date).getHours()))
    } else {
      const existing = typeof originalSale.date === 'string' && originalSale.date.length >= 10 ? originalSale.date.slice(0, 10) : new Date(originalSale.date).toISOString().split('T')[0]
      dateToStore = existing
      saleHour = hour !== undefined && hour !== null ? Number(hour) : (typeof originalSale.hour === 'number' ? originalSale.hour : 0)
    }

    // Fecha-hora de la venta en local (para lastSaleDate de productos)
    const [y, m, d] = dateToStore.split('-').map(Number)
    const saleDate = new Date(y, m - 1, d, saleHour, 0, 0, 0)

    const updates: any = {
      date: dateToStore,
      hour: saleHour,
      total: total !== undefined ? total : originalSale.total,
      paymentMethod: paymentMethod !== undefined ? paymentMethod : originalSale.paymentMethod,
    }
    
    // Mapear 'comment' a 'notes' (que es el nombre de la columna en SQLite)
    if (comment !== undefined) {
      updates.notes = comment
    } else if (originalSale.comment) {
      updates.notes = originalSale.comment
    }
    
    // No incluir channel, subtotal, discount, etc. porque no existen en la tabla SQLite

    // Solo actualizar stock si se están cambiando los items
    const itemsChanged = items && Array.isArray(items) && items.length > 0
    
    if (itemsChanged) {
      // Restaurar stock de productos originales
      for (const item of originalSale.items) {
        try {
          const product = await getProductById(item.productId)
          if (product) {
            const newStock = product.stock + item.quantity
            const newTotalSold = Math.max(0, (product.totalSold || 0) - item.quantity)
            
            await updateProduct(item.productId, {
              stock: newStock,
              totalSold: newTotalSold
            })
          }
        } catch (productError: any) {
          console.error(`[API] Error restaurando stock de producto ${item.productId}:`, productError)
        }
      }

      // Actualizar items
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
    console.log('[API] Actualizando venta:', id)
    console.log('[API] Updates:', JSON.stringify(updates, null, 2))
    
    try {
      const updatedSale = await updateSale(id, updates)
      
      if (!updatedSale) {
        console.error('[API] updateSale retornó null')
        return NextResponse.json(
          { error: 'Error al actualizar la venta: updateSale retornó null' },
          { status: 500 }
        )
      }

      console.log('[API] Venta actualizada exitosamente')
      return NextResponse.json(updatedSale)
    } catch (updateError: any) {
      console.error('[API] Error en updateSale:', updateError)
      throw updateError
    }
  } catch (error: any) {
    console.error('[API] Error actualizando venta:', error)
    console.error('[API] Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: 'Error al actualizar la venta',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sale = await getSaleById(id)
    
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
    const deleted = await deleteSale(id)
    
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

