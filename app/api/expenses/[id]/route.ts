import { NextRequest, NextResponse } from 'next/server'
import { updateExpense, deleteExpense, getExpenses } from '@/lib/db-expenses'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updated = await updateExpense(params.id, body)
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al actualizar gasto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteExpense(params.id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Gasto no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar gasto' },
      { status: 500 }
    )
  }
}

