import { NextRequest, NextResponse } from 'next/server'
import { getInventory, updateInventoryItem, deleteInventoryItem } from '@/lib/db-inventory'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { lotName, updates } = body

    if (!lotName) {
      return NextResponse.json(
        { error: 'Nombre de lote requerido' },
        { status: 400 }
      )
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Actualizaciones requeridas' },
        { status: 400 }
      )
    }

    // Obtener todos los items del inventario
    const inventory = await getInventory()
    
    // Filtrar items que pertenecen al lote
    const itemsToUpdate = inventory.filter(item => item.lot === lotName)

    if (itemsToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron items para este lote' },
        { status: 404 }
      )
    }

    // Actualizar cada item
    const updatedItems = []
    const errors = []

    for (const item of itemsToUpdate) {
      try {
        const updated = await updateInventoryItem(item.id, updates)
        if (updated) {
          updatedItems.push(updated)
        } else {
          errors.push(`Error actualizando item ${item.id}`)
        }
      } catch (error: any) {
        console.error(`Error actualizando item ${item.id}:`, error)
        errors.push(`Error actualizando item ${item.id}: ${error.message}`)
      }
    }

    if (errors.length > 0 && updatedItems.length === 0) {
      return NextResponse.json(
        { 
          error: 'Error al actualizar items del lote',
          details: errors
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedItems.length,
      items: updatedItems,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Error actualizando items del lote:', error)
    return NextResponse.json(
      { 
        error: 'Error al actualizar items del lote',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { lotName } = body

    if (!lotName) {
      return NextResponse.json(
        { error: 'Nombre de lote requerido' },
        { status: 400 }
      )
    }

    // Obtener todos los items del inventario
    const inventory = await getInventory()
    
    // Normalizar el nombre del lote (trim y comparación case-insensitive)
    const normalizedLotName = lotName.trim()
    
    console.log('[DELETE] Buscando lote:', normalizedLotName)
    console.log('[DELETE] Total items en inventario:', inventory.length)
    
    // Filtrar items que pertenecen al lote (comparación más robusta)
    const itemsToDelete = inventory.filter(item => {
      if (!item.lot) return false
      const itemLot = typeof item.lot === 'string' ? item.lot.trim() : String(item.lot).trim()
      return itemLot === normalizedLotName
    })

    console.log('[DELETE] Items encontrados para eliminar:', itemsToDelete.length)
    if (itemsToDelete.length > 0) {
      console.log('[DELETE] Primeros items a eliminar:', itemsToDelete.slice(0, 3).map(i => ({ id: i.id, name: i.name, lot: i.lot })))
    } else {
      // Debug: mostrar todos los lotes únicos disponibles
      const lots = inventory
        .map(i => (typeof i.lot === 'string' ? i.lot.trim() : i.lot ? String(i.lot).trim() : ''))
        .filter((l): l is string => Boolean(l))

      const uniqueLotsMap: Record<string, true> = {}
      for (const l of lots) uniqueLotsMap[l] = true
      const uniqueLots = Object.keys(uniqueLotsMap)
      console.log('[DELETE] Lotes disponibles en inventario:', uniqueLots.slice(0, 10))
    }

    if (itemsToDelete.length === 0) {
      const lots = inventory
        .map(i => (typeof i.lot === 'string' ? i.lot.trim() : i.lot ? String(i.lot).trim() : ''))
        .filter((l): l is string => Boolean(l))

      const uniqueLotsMap: Record<string, true> = {}
      for (const l of lots) uniqueLotsMap[l] = true
      const availableLots = Object.keys(uniqueLotsMap)

      return NextResponse.json(
        { 
          error: 'No se encontraron items para este lote',
          debug: {
            searchedLot: normalizedLotName,
            totalItems: inventory.length,
            availableLots: availableLots.slice(0, 10)
          }
        },
        { status: 404 }
      )
    }

    // Eliminar cada item
    const deletedItems = []
    const errors = []

    for (const item of itemsToDelete) {
      try {
        const deleted = await deleteInventoryItem(item.id)
        if (deleted) {
          deletedItems.push(item.id)
        } else {
          errors.push(`Error eliminando item ${item.id}`)
        }
      } catch (error: any) {
        console.error(`Error eliminando item ${item.id}:`, error)
        errors.push(`Error eliminando item ${item.id}: ${error.message}`)
      }
    }

    if (errors.length > 0 && deletedItems.length === 0) {
      return NextResponse.json(
        { 
          error: 'Error al eliminar items del lote',
          details: errors
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedItems.length,
      deletedItems: deletedItems,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Error eliminando items del lote:', error)
    return NextResponse.json(
      { 
        error: 'Error al eliminar items del lote',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
