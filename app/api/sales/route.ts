import { NextRequest, NextResponse } from 'next/server'
import { createSale, getSales, getSalesByDateRange } from '@/lib/db-sales'
import { updateProduct, getProductById } from '@/lib/db-products'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (startDate && endDate) {
      const sales = await getSalesByDateRange(startDate, endDate)
      return NextResponse.json(sales)
    }
    
    const sales = await getSales()
    return NextResponse.json(sales)
  } catch (error: any) {
    console.error('[API] Error obteniendo ventas:', error)
    const errorMessage = error?.message || 'Error desconocido al obtener ventas'
    return NextResponse.json(
      { 
        error: 'Error al obtener ventas',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, total, subtotal, discount, discountType, discountValue, comment, channel, paymentMethod, date, hour } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'La venta debe tener al menos un item' },
        { status: 400 }
      )
    }

    // Usar fecha proporcionada o fecha actual
    const saleDate = date ? new Date(date) : new Date()
    const saleHour = hour !== undefined ? hour : saleDate.getHours()
    
    console.log('[API] Creando venta con items:', items.length)
    
    // Crear la venta
    let sale
    try {
      sale = await createSale({
        date: saleDate.toISOString(),
        hour: saleHour,
        items: items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        })),
        total,
        subtotal: subtotal || total,
        discount: discount || 0,
        discountType: discountType,
        discountValue: discountValue,
        comment: comment,
        channel: channel || 'whatsapp',
        paymentMethod: paymentMethod || 'efectivo',
        ticketNumber: `T-${Date.now()}`
      })
      console.log('[API] Venta creada exitosamente:', sale.id)
    } catch (saleError: any) {
      console.error('[API] Error creando venta en Firebase:', saleError)
      throw new Error(`Error al crear venta: ${saleError.message}`)
    }

    // Actualizar stock y última fecha de venta de productos
    // Esto es secundario, no debe fallar la venta si un producto no se actualiza
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
          console.log(`[API] Producto ${item.productId} actualizado`)
        } else {
          console.warn(`[API] Producto ${item.productId} no encontrado para actualizar stock`)
          updateErrors.push(`Producto ${item.productId} no encontrado`)
        }
      } catch (productError: any) {
        console.error(`[API] Error actualizando producto ${item.productId}:`, productError)
        updateErrors.push(`Error actualizando producto ${item.productId}: ${productError.message}`)
        // Continuar con los demás productos
      }
    }

    // Si hubo errores actualizando productos, loguearlos pero no fallar la venta
    if (updateErrors.length > 0) {
      console.warn('[API] Advertencias al actualizar productos:', updateErrors)
    }

    return NextResponse.json({
      ...sale,
      warnings: updateErrors.length > 0 ? updateErrors : undefined
    }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error creando venta:', error)
    console.error('[API] Stack trace:', error.stack)
    const errorMessage = error?.message || 'Error desconocido al crear venta'
    return NextResponse.json(
      { 
        error: 'Error al crear venta',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

