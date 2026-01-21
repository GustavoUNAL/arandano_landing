import { NextRequest, NextResponse } from 'next/server'
import { getTasks, createTask } from '@/lib/db-tasks'
import { getTasks as getTasksJSON } from '@/lib/tasks'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const completed = searchParams.get('completed')
    
    let tasks = await getTasks()
    
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
  } catch (error: any) {
    console.error('[API] Error obteniendo tareas:', error)
    console.error('[API] Stack trace:', error?.stack)
    const errorMessage = error?.message || 'Error desconocido al obtener tareas'
    
    // Intentar usar JSON como fallback si hay error con SQLite
    try {
      const jsonTasks = getTasksJSON()
      
      // Aplicar los mismos filtros que se harían normalmente
      let tasks = jsonTasks
      const { searchParams } = new URL(request.url)
      const category = searchParams.get('category')
      const priority = searchParams.get('priority')
      const completed = searchParams.get('completed')
      
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
      
      return NextResponse.json(tasks)
    } catch (fallbackError) {
      // Ignorar error de fallback
    }
    
    return NextResponse.json(
      { 
        error: 'Error al obtener tareas',
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
    const { title, description, category, priority, dueDate, assignedTo, tags } = body

    if (!title || !category || !priority) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const task = await createTask({
      title,
      description: description || '',
      category,
      priority,
      dueDate: dueDate || undefined,
      assignedTo: assignedTo || undefined,
      tags: tags || []
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error creando tarea:', error)
    const errorMessage = error?.message || 'Error desconocido al crear tarea'
    return NextResponse.json(
      { 
        error: 'Error al crear tarea',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

