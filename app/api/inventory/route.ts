import { NextRequest, NextResponse } from 'next/server'
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/lib/db-inventory'
import { getInventory as getInventoryJSON } from '@/lib/inventory'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const inventory = await getInventory()
    return NextResponse.json(inventory)
  } catch (error: any) {
    console.error('[API] Error obteniendo inventario:', error)
    console.error('[API] Stack trace:', error?.stack)
    const errorMessage = error?.message || 'Error desconocido al obtener inventario'
    
    // Si es un error de cuota de Firebase, retornar un mensaje más claro
    if (errorMessage.includes('Quota exceeded') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      console.warn('[API] Firebase quota exceeded - usando fallback')
      // Intentar usar JSON como fallback si está disponible
      try {
        const jsonInventory = getInventoryJSON()
        return NextResponse.json(jsonInventory)
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
        error: 'Error al obtener inventario',
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
    const item = await createInventoryItem(body)
    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error creando item de inventario:', error)
    const errorMessage = error?.message || 'Error desconocido al crear item de inventario'
    return NextResponse.json(
      { 
        error: 'Error al crear item de inventario',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

