import { NextRequest, NextResponse } from 'next/server'
import { createSale, getSales, getSalesByDateRange } from '@/lib/db-sales'
import { getSales as getSalesJSON } from '@/lib/sales'
import { getDbMode } from '@/lib/db-utils'
import { updateProduct, getProductById } from '@/lib/db-products'
import { getRecipeByProductId } from '@/lib/db-recipes'
import { getInventory, updateInventoryItem } from '@/lib/db-inventory'
import { createStockMovement } from '@/lib/db-stock-movements'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (startDate && endDate) {
      const sales = await getSalesByDateRange(startDate, endDate)
      return NextResponse.json(sales, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      })
    }

    const sales = await getSales()
    return NextResponse.json(sales, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })
  } catch (error: any) {
    console.error('[API] Error obteniendo ventas:', error)
    console.error('[API] Stack trace:', error?.stack)
    const errorMessage = error?.message || 'Error desconocido al obtener ventas'

    // Solo usar JSON como fallback si el proyecto está en modo JSON.
    // En modo SQLite no devolver sales.json (está desactualizado) para no mostrar lista incorrecta.
    if (getDbMode() === 'json') {
      try {
        const jsonSales = getSalesJSON()
        return NextResponse.json(jsonSales)
      } catch (fallbackError) {
        // seguir y devolver 500
      }
    }

    return NextResponse.json(
      {
        error: 'Error al obtener ventas',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        message: errorMessage
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

    // Guardar fecha como YYYY-MM-DD para que el resumen por día coincida siempre
    const isDateOnly = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    const dateOnly = isDateOnly ? date : (date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    const saleHour = hour !== undefined ? Number(hour) : (date ? new Date(date).getHours() : new Date().getHours())
    const totalNumber = typeof total === 'number' ? total : Number(total) || 0

    console.log('[API] Creando venta con items:', items.length, 'fecha', dateOnly, 'hora', saleHour)

    // Crear la venta (si esto falla, sí devolvemos error)
    let sale
    try {
      sale = await createSale({
        date: dateOnly,
        hour: saleHour,
        items: items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
        })),
        total: totalNumber,
        subtotal: typeof subtotal === 'number' ? subtotal : totalNumber,
        discount: discount ?? 0,
        discountType: discountType,
        discountValue: discountValue,
        comment: comment,
        channel: channel || 'whatsapp',
        paymentMethod: paymentMethod || 'efectivo',
        ticketNumber: `T-${Date.now()}`
      })
      console.log('[API] Venta creada exitosamente:', sale.id)
    } catch (saleError: any) {
      console.error('[API] Error creando venta:', saleError)
      throw new Error(`Error al crear venta: ${saleError.message}`)
    }

    // Actualizar stock (opcional): si falla, la venta ya está guardada y devolvemos 201 con advertencia
    const updateErrors: string[] = []
    try {
      const inventory = await getInventory()

      for (const item of items) {
        try {
          const product = await getProductById(item.productId)
          if (!product) {
            updateErrors.push(`Producto ${item.productId} no encontrado`)
            continue
          }

          const isRecipeProduct = product.category === 'coctel' ||
            product.category === 'cafe-caliente' ||
            product.category === 'cafe-frio'

          if (isRecipeProduct) {
            const recipe = await getRecipeByProductId(product.id)
            if (recipe) {
              for (const ingredient of recipe.ingredients) {
                const inventoryItem = inventory.find(inv => inv.id === ingredient.productId)
                if (inventoryItem) {
                  const totalQuantityToDiscount = ingredient.quantity * item.quantity
                  const newQuantity = Math.max(0, (inventoryItem.quantity || 0) - totalQuantityToDiscount)
                  await updateInventoryItem(inventoryItem.id, { quantity: newQuantity })
                  await createStockMovement({
                    type: 'recipe-consumption',
                    inventoryItemId: inventoryItem.id,
                    productId: product.id,
                    productName: inventoryItem.name,
                    quantity: -totalQuantityToDiscount,
                    unit: ingredient.unit,
                    saleId: sale.id,
                    recipeId: recipe.id,
                    date: saleDate.toISOString(),
                    comment: `Consumo por venta de ${item.quantity}x ${product.name}`
                  })
                } else {
                  updateErrors.push(`Ingrediente ${ingredient.productName} no encontrado`)
                }
              }
            } else {
              updateErrors.push(`Producto ${product.name} sin receta`)
            }
          } else {
            await updateProduct(item.productId, {
              stock: Math.max(0, (product.stock || 0) - item.quantity),
              lastSaleDate: saleDate.toISOString(),
              totalSold: (product.totalSold || 0) + item.quantity
            })
            await createStockMovement({
              type: 'sale',
              productId: product.id,
              productName: product.name,
              quantity: -item.quantity,
              unit: 'unidad',
              saleId: sale.id,
              date: saleDate.toISOString(),
              comment: `Venta de ${item.quantity} unidades`
            })
          }
        } catch (productError: any) {
          console.error(`[API] Error actualizando producto ${item.productId}:`, productError)
          updateErrors.push(`Error producto ${item.productId}: ${productError.message}`)
        }
      }
    } catch (stockError: any) {
      console.warn('[API] Error al actualizar stock (venta ya guardada):', stockError?.message)
      updateErrors.push(`Stock no actualizado: ${stockError?.message}`)
    }

    if (updateErrors.length > 0) {
      console.warn('[API] Advertencias:', updateErrors)
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

