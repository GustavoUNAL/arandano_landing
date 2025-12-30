import fs from 'fs'
import path from 'path'

export type TaskCategory = 
  | 'inventario'
  | 'compras'
  | 'mantenimiento'
  | 'marketing'
  | 'finanzas'
  | 'personal'
  | 'operaciones'
  | 'limpieza'
  | 'eventos'
  | 'otro'

export type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente'

export interface Task {
  id: string
  title: string
  description?: string
  category: TaskCategory
  priority: TaskPriority
  completed: boolean
  dueDate?: string // ISO string
  createdAt: string // ISO string
  completedAt?: string // ISO string
  assignedTo?: string
  tags?: string[]
}

const tasksFilePath = path.join(process.cwd(), 'data', 'tasks.json')

export function getTasks(): Task[] {
  try {
    if (!fs.existsSync(tasksFilePath)) {
      return []
    }
    const fileContents = fs.readFileSync(tasksFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    console.error('Error reading tasks file:', error)
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing tasks file:', error)
    throw error
  }
}

export function createTask(task: Omit<Task, 'id' | 'createdAt' | 'completed'>): Task {
  const tasks = getTasks()
  const newTask: Task = {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    completed: false
  }
  tasks.push(newTask)
  saveTasks(tasks)
  return newTask
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const tasks = getTasks()
  const index = tasks.findIndex(t => t.id === id)
  if (index === -1) return null
  
  // Si se marca como completada, agregar fecha de completado
  if (updates.completed && !tasks[index].completed) {
    updates.completedAt = new Date().toISOString()
  }
  // Si se desmarca como completada, quitar fecha de completado
  if (updates.completed === false && tasks[index].completed) {
    updates.completedAt = undefined
  }
  
  tasks[index] = { ...tasks[index], ...updates }
  saveTasks(tasks)
  return tasks[index]
}

export function deleteTask(id: string): boolean {
  const tasks = getTasks()
  const filtered = tasks.filter(t => t.id !== id)
  if (filtered.length === tasks.length) return false
  
  saveTasks(filtered)
  return true
}

export function getTasksByCategory(category: TaskCategory): Task[] {
  const tasks = getTasks()
  return tasks.filter(t => t.category === category)
}

export function getTasksByPriority(priority: TaskPriority): Task[] {
  const tasks = getTasks()
  return tasks.filter(t => t.priority === priority)
}

export function getOverdueTasks(): Task[] {
  const tasks = getTasks()
  const now = new Date()
  return tasks.filter(t => 
    !t.completed && 
    t.dueDate && 
    new Date(t.dueDate) < now
  )
}

