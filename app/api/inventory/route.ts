import { NextRequest, NextResponse } from 'next/server'
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/lib/db-inventory'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const inventory = await getInventory()
    return NextResponse.json(inventory)
  } catch (error: any) {
    console.error('[API] Error obteniendo inventario:', error)
    const errorMessage = error?.message || 'Error desconocido al obtener inventario'
    return NextResponse.json(
      { 
        error: 'Error al obtener inventario',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
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

