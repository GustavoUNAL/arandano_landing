import { NextRequest, NextResponse } from 'next/server'
import { createSale, getSales, getSalesByDateRange } from '@/lib/db-sales'
import { getSales as getSalesJSON } from '@/lib/sales'
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
      return NextResponse.json(sales)
    }
    
    const sales = await getSales()
    return NextResponse.json(sales)
  } catch (error: any) {
    console.error('[API] Error obteniendo ventas:', error)
    console.error('[API] Stack trace:', error?.stack)
    const errorMessage = error?.message || 'Error desconocido al obtener ventas'
    
    // Si es un error de cuota de Firebase, retornar un mensaje más claro
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.warn('[API] Firebase quota exceeded - usando fallback')
      // Intentar usar JSON como fallback si está disponible
      try {
        const jsonSales = getSalesJSON()
        return NextResponse.json(jsonSales)
      } catch (fallbackError) {
        return NextResponse.json(
          { 
            error: 'Cuota de Firebase excedida. Por favor, espera unos minutos o verifica tu plan de Firebase.',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 503 }
        )
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
    // Si es cóctel/café: descontar ingredientes según receta
    // Si es producto normal: descontar stock del producto
    const updateErrors: string[] = []
    const inventory = await getInventory()
    
    for (const item of items) {
      try {
        const product = await getProductById(item.productId)
        if (!product) {
          console.warn(`[API] Producto ${item.productId} no encontrado para actualizar stock`)
          updateErrors.push(`Producto ${item.productId} no encontrado`)
          continue
        }

        // Verificar si es cóctel o café (tiene receta)
        const isRecipeProduct = product.category === 'coctel' || 
                                product.category === 'cafe-caliente' || 
                                product.category === 'cafe-frio'
        
        if (isRecipeProduct) {
          // Obtener receta
          const recipe = await getRecipeByProductId(product.id)
          
          if (recipe) {
            // Descontar ingredientes según receta
            for (const ingredient of recipe.ingredients) {
              const inventoryItem = inventory.find(inv => inv.id === ingredient.productId)
              
              if (inventoryItem) {
                // Calcular cantidad a descontar por cada unidad vendida
                const totalQuantityToDiscount = ingredient.quantity * item.quantity
                const newQuantity = Math.max(0, (inventoryItem.quantity || 0) - totalQuantityToDiscount)
                
                // Actualizar inventario
                await updateInventoryItem(inventoryItem.id, {
                  quantity: newQuantity
                })
                
                // Registrar movimiento de stock
                await createStockMovement({
                  type: 'recipe-consumption',
                  inventoryItemId: inventoryItem.id,
                  productId: product.id,
                  productName: inventoryItem.name,
                  quantity: -totalQuantityToDiscount, // Negativo porque es salida
                  unit: ingredient.unit,
                  saleId: sale.id,
                  recipeId: recipe.id,
                  date: saleDate.toISOString(),
                  comment: `Consumo por venta de ${item.quantity}x ${product.name}`
                })
                
                console.log(`[API] Ingrediente ${ingredient.productName} actualizado: -${totalQuantityToDiscount} ${ingredient.unit}`)
              } else {
                console.warn(`[API] Ingrediente ${ingredient.productId} no encontrado en inventario`)
                updateErrors.push(`Ingrediente ${ingredient.productName} no encontrado`)
              }
            }
          } else {
            console.warn(`[API] Producto ${product.name} (cóctel/café) no tiene receta configurada`)
            updateErrors.push(`Producto ${product.name} sin receta`)
          }
        } else {
          // Producto normal: descontar stock directo
          await updateProduct(item.productId, {
            stock: Math.max(0, (product.stock || 0) - item.quantity),
            lastSaleDate: saleDate.toISOString(),
            totalSold: (product.totalSold || 0) + item.quantity
          })
          
          // Registrar movimiento de stock
          await createStockMovement({
            type: 'sale',
            productId: product.id,
            productName: product.name,
            quantity: -item.quantity, // Negativo porque es salida
            unit: 'unidad',
            saleId: sale.id,
            date: saleDate.toISOString(),
            comment: `Venta de ${item.quantity} unidades`
          })
          
          console.log(`[API] Producto ${item.productId} actualizado: -${item.quantity} unidades`)
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

