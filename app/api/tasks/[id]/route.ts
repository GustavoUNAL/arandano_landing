import { NextRequest, NextResponse } from 'next/server'
import { updateTask, deleteTask } from '@/lib/db-tasks'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updated = await updateTask(params.id, body)
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteTask(params.id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    )
  }
}

