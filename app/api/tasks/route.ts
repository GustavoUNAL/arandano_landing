import { NextRequest, NextResponse } from 'next/server'
import { getTasks, createTask } from '@/lib/db-tasks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const completed = searchParams.get('completed')
    
    let tasks = getTasks()
    
    if (category) {
      tasks = tasks.filter(t => t.category === category)
    }
    
    if (priority) {
      tasks = tasks.filter(t => t.priority === priority)
    }
    
    if (completed !== null) {
      const isCompleted = completed === 'true'
      tasks = tasks.filter(t => t.completed === isCompleted)
    }
    
    // Ordenar: pendientes primero, luego por prioridad y fecha
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      if (!a.completed) {
        const priorityOrder = { urgente: 0, alta: 1, media: 2, baja: 3 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        if (a.dueDate) return -1
        if (b.dueDate) return 1
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, priority, dueDate, assignedTo, tags } = body

    if (!title || !category || !priority) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const task = createTask({
      title,
      description: description || '',
      category,
      priority,
      dueDate: dueDate || undefined,
      assignedTo: assignedTo || undefined,
      tags: tags || []
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    )
  }
}

