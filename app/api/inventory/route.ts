import { NextRequest, NextResponse } from 'next/server'
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/lib/db-inventory'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const inventory = getInventory()
    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Error al obtener inventario' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const item = createInventoryItem(body)
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Error al crear item de inventario' },
      { status: 500 }
    )
  }
}

