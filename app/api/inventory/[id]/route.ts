import { NextRequest, NextResponse } from 'next/server'
import { updateInventoryItem, deleteInventoryItem } from '@/lib/db-inventory'
import { normalizeInventoryCategory } from '@/lib/inventory-categories'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    if (body.category !== undefined) {
      body.category = normalizeInventoryCategory(body.category)
    }
    const item = await updateInventoryItem(params.id, body)
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item de inventario no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { error: 'Error al actualizar item de inventario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteInventoryItem(params.id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Item de inventario no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { error: 'Error al eliminar item de inventario' },
      { status: 500 }
    )
  }
}

