/**
 * Servicio de tareas (SQLite / PostgreSQL / JSON)
 */

import { Task, TaskCategory, TaskPriority } from './tasks'
import { getDbMode } from './db-utils'
import { dbAll, dbGet, dbRun } from './db'

export type { Task, TaskCategory, TaskPriority } from './tasks'

import {
  getTasks as getTasksJSON,
  createTask as createTaskJSON,
  updateTask as updateTaskJSON,
  deleteTask as deleteTaskJSON,
  getTasksByCategory as getTasksByCategoryJSON,
  getTasksByPriority as getTasksByPriorityJSON,
  getOverdueTasks as getOverdueTasksJSON,
} from './tasks'

function rowToTask(row: Record<string, unknown>): Task {
  let parsedTags: string[] | undefined
  if (row.tags) {
    try {
      parsedTags = JSON.parse(row.tags as string)
    } catch {
      parsedTags = undefined
    }
  }
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || undefined,
    category: row.category as TaskCategory,
    priority: row.priority as TaskPriority,
    completed: Boolean(row.completed),
    createdAt: row.createdAt as string,
    completedAt: (row.completedAt as string) || undefined,
    dueDate: (row.dueDate as string) || undefined,
    assignedTo: (row.assignedTo as string) || undefined,
    tags: parsedTags,
  }
}

export async function getTasks(): Promise<Task[]> {
  if (getDbMode() === 'json') return getTasksJSON()
  const rows = await dbAll<Record<string, unknown>>('SELECT * FROM tasks ORDER BY createdAt DESC')
  return rows.map(rowToTask)
}

export async function createTask(
  task: Omit<Task, 'id' | 'createdAt' | 'completed'>
): Promise<Task> {
  const newTask: Task = {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    completed: false,
  }

  if (getDbMode() === 'json') return createTaskJSON(task)

  await dbRun(
    `INSERT INTO tasks (id, title, description, category, priority, completed, createdAt, dueDate, assignedTo, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newTask.id,
      newTask.title,
      newTask.description || null,
      newTask.category,
      newTask.priority,
      0,
      newTask.createdAt,
      newTask.dueDate || null,
      newTask.assignedTo || null,
      newTask.tags ? JSON.stringify(newTask.tags) : null,
    ]
  )

  return newTask
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  if (getDbMode() === 'json') return updateTaskJSON(id, updates)

  const fields: string[] = []
  const values: unknown[] = []

  if (updates.completed === true) {
    updates.completedAt = new Date().toISOString()
  }
  if (updates.completed === false) {
    updates.completedAt = null as unknown as string
  }

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      if (key === 'completed') {
        fields.push('completed = ?')
        values.push(value ? 1 : 0)
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
    const row = await dbGet<Record<string, unknown>>('SELECT * FROM tasks WHERE id = ?', [id])
    if (!row) return null
    return rowToTask(row)
  }

  values.push(id)
  await dbRun(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values)

  const row = await dbGet<Record<string, unknown>>('SELECT * FROM tasks WHERE id = ?', [id])
  if (!row) return null
  return rowToTask(row)
}

export async function deleteTask(id: string): Promise<boolean> {
  if (getDbMode() === 'json') return deleteTaskJSON(id)
  const result = await dbRun('DELETE FROM tasks WHERE id = ?', [id])
  return result.changes > 0
}

export async function getTasksByCategory(category: TaskCategory): Promise<Task[]> {
  if (getDbMode() === 'json') return getTasksByCategoryJSON(category)
  const rows = await dbAll<Record<string, unknown>>(
    'SELECT * FROM tasks WHERE category = ? ORDER BY createdAt DESC',
    [category]
  )
  return rows.map(rowToTask)
}

export async function getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
  if (getDbMode() === 'json') return getTasksByPriorityJSON(priority)
  const rows = await dbAll<Record<string, unknown>>(
    'SELECT * FROM tasks WHERE priority = ? ORDER BY createdAt DESC',
    [priority]
  )
  return rows.map(rowToTask)
}

export async function getOverdueTasks(): Promise<Task[]> {
  if (getDbMode() === 'json') return getOverdueTasksJSON()
  const now = new Date().toISOString()
  const rows = await dbAll<Record<string, unknown>>(
    `SELECT * FROM tasks 
    WHERE completed = 0 AND dueDate IS NOT NULL AND dueDate < ?
    ORDER BY dueDate ASC`,
    [now]
  )
  return rows.map(rowToTask)
}
