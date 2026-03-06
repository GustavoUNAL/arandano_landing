/**
 * Servicio de tareas usando SQLite
 * Mantiene compatibilidad con la interfaz existente
 */

import { Task, TaskCategory, TaskPriority } from './tasks'
import { getDbMode } from './db-utils'
import { getDatabase } from './db-sqlite'

// Re-exportar tipos
export type { Task, TaskCategory, TaskPriority } from './tasks'

// Importar funciones JSON (solo si DB_MODE === 'json')
import { getTasks as getTasksJSON, saveTasks as saveTasksJSON, createTask as createTaskJSON, updateTask as updateTaskJSON, deleteTask as deleteTaskJSON, getTasksByCategory as getTasksByCategoryJSON, getTasksByPriority as getTasksByPriorityJSON, getOverdueTasks as getOverdueTasksJSON } from './tasks'

function rowToTask(row: any): Task {
  let parsedTags: string[] | undefined
  if (row.tags) {
    try {
      parsedTags = JSON.parse(row.tags)
    } catch {
      parsedTags = undefined
    }
  }
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    category: row.category as TaskCategory,
    priority: row.priority as TaskPriority,
    completed: Boolean(row.completed),
    createdAt: row.createdAt,
    completedAt: row.completedAt || undefined,
    dueDate: row.dueDate || undefined,
    assignedTo: row.assignedTo || undefined,
    tags: parsedTags
  }
}

export async function getTasks(): Promise<Task[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getTasksJSON()
  }
  
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all() as any[]
  return rows.map(rowToTask)
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'completed'>): Promise<Task> {
  const mode = getDbMode()
  const newTask: Task = {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    completed: false
  }

  if (mode === 'json') {
    return createTaskJSON(task)
  }
  
  const db = getDatabase()
  db.prepare(`
    INSERT INTO tasks (id, title, description, category, priority, completed, createdAt, dueDate, assignedTo, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newTask.id,
    newTask.title,
    newTask.description || null,
    newTask.category,
    newTask.priority,
    0, // completed as integer
    newTask.createdAt,
    newTask.dueDate || null,
    newTask.assignedTo || null,
    newTask.tags ? JSON.stringify(newTask.tags) : null
  )
  
  return newTask
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return updateTaskJSON(id, updates)
  }
  
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []
  
  // Si se marca como completada, agregar fecha de completado
  if (updates.completed === true) {
    updates.completedAt = new Date().toISOString()
  }
  // Si se desmarca como completada, quitar fecha de completado
  if (updates.completed === false) {
    updates.completedAt = null as any
  }
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      if (key === 'completed') {
        fields.push('completed = ?')
        values.push(value ? 1 : 0) // Convertir boolean a integer
      } else if (key === 'tags') {
        fields.push('tags = ?')
        if (Array.isArray(value)) values.push(JSON.stringify(value))
        else if (typeof value === 'string') values.push(value)
        else values.push(null)
      } else if (key === 'completedAt' && value === null) {
        fields.push('completedAt = ?')
        values.push(null)
      } else {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
  })
  
  if (fields.length === 0) {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any
    if (!row) return null
    return rowToTask(row)
  }
  
  values.push(id)
  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any
  if (!row) return null
  
  return rowToTask(row)
}

export async function deleteTask(id: string): Promise<boolean> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return deleteTaskJSON(id)
  }
  
  const db = getDatabase()
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  return result.changes > 0
}

export async function getTasksByCategory(category: TaskCategory): Promise<Task[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getTasksByCategoryJSON(category)
  }
  
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM tasks WHERE category = ? ORDER BY createdAt DESC').all(category) as any[]
  return rows.map(rowToTask)
}

export async function getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getTasksByPriorityJSON(priority)
  }
  
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM tasks WHERE priority = ? ORDER BY createdAt DESC').all(priority) as any[]
  return rows.map(rowToTask)
}

export async function getOverdueTasks(): Promise<Task[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getOverdueTasksJSON()
  }
  
  const now = new Date().toISOString()
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM tasks 
    WHERE completed = 0 AND dueDate IS NOT NULL AND dueDate < ?
    ORDER BY dueDate ASC
  `).all(now) as any[]
  
  return rows.map(rowToTask)
}
