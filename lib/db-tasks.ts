/**
 * Servicio de tareas usando Firebase Firestore
 * Mantiene compatibilidad con la interfaz existente
 */

import { db } from './firebase-admin'
import { Task, TaskCategory, TaskPriority } from './tasks'
import { isDbAvailable } from './db-utils'

// Re-exportar tipos
export type { Task, TaskCategory, TaskPriority } from './tasks'

// Modo: 'firebase' | 'json' | 'hybrid'
const DB_MODE = (process.env.DB_MODE || 'firebase') as 'firebase' | 'json' | 'hybrid'

// Importar funciones JSON como fallback
import { getTasks as getTasksJSON, saveTasks as saveTasksJSON, createTask as createTaskJSON, updateTask as updateTaskJSON, deleteTask as deleteTaskJSON, getTasksByCategory as getTasksByCategoryJSON, getTasksByPriority as getTasksByPriorityJSON, getOverdueTasks as getOverdueTasksJSON } from './tasks'

export async function getTasks(): Promise<Task[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getTasksJSON()
  }

  try {
    if (!isDbAvailable()) {
      return getTasksJSON()
    }
    
    if (DB_MODE === 'firebase') {
      const snapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get()
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Task))
    } else {
      try {
        const snapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get()
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Task))
      } catch (error) {
        console.warn('Error leyendo de Firestore, usando JSON:', error)
        return getTasksJSON()
      }
    }
  } catch (error) {
    console.error('Error obteniendo tareas:', error)
    return getTasksJSON()
  }
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'completed'>): Promise<Task> {
  const newTask: Task = {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    completed: false
  }

  if (DB_MODE === 'json' || !isDbAvailable()) {
    return createTaskJSON(task)
  }

  try {
    await db.collection('tasks').doc(newTask.id).set(newTask)
    
    if (DB_MODE === 'hybrid') {
      const tasks = getTasksJSON()
      tasks.push(newTask)
      saveTasksJSON(tasks)
    }
    
    return newTask
  } catch (error) {
    console.error('Error creando tarea:', error)
    return createTaskJSON(task)
  }
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return updateTaskJSON(id, updates)
  }

  try {
    // Si se marca como completada, agregar fecha de completado
    if (updates.completed === true) {
      updates.completedAt = new Date().toISOString()
    }
    // Si se desmarca como completada, quitar fecha de completado
    if (updates.completed === false) {
      updates.completedAt = undefined
    }

    const docRef = db.collection('tasks').doc(id)
    await docRef.update(updates)
    
    const updated = await docRef.get()
    if (!updated.exists) return null
    
    const updatedTask = { id: updated.id, ...updated.data() } as Task
    
    if (DB_MODE === 'hybrid') {
      const tasks = getTasksJSON()
      const index = tasks.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks[index] = updatedTask
        saveTasksJSON(tasks)
      }
    }
    
    return updatedTask
  } catch (error) {
    console.error('Error actualizando tarea:', error)
    return updateTaskJSON(id, updates)
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return deleteTaskJSON(id)
  }

  try {
    await db.collection('tasks').doc(id).delete()
    
    if (DB_MODE === 'hybrid') {
      const tasks = getTasksJSON()
      const filtered = tasks.filter(t => t.id !== id)
      saveTasksJSON(filtered)
    }
    
    return true
  } catch (error) {
    console.error('Error eliminando tarea:', error)
    return deleteTaskJSON(id)
  }
}

export async function getTasksByCategory(category: TaskCategory): Promise<Task[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getTasksByCategoryJSON(category)
  }

  try {
    const snapshot = await db.collection('tasks')
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .get()
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Task))
  } catch (error) {
    console.error('Error obteniendo tareas por categoría:', error)
    return getTasksByCategoryJSON(category)
  }
}

export async function getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getTasksByPriorityJSON(priority)
  }

  try {
    const snapshot = await db.collection('tasks')
      .where('priority', '==', priority)
      .orderBy('createdAt', 'desc')
      .get()
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Task))
  } catch (error) {
    console.error('Error obteniendo tareas por prioridad:', error)
    return getTasksByPriorityJSON(priority)
  }
}

export async function getOverdueTasks(): Promise<Task[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getOverdueTasksJSON()
  }

  try {
    const now = new Date().toISOString()
    const snapshot = await db.collection('tasks')
      .where('completed', '==', false)
      .where('dueDate', '<', now)
      .get()
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Task))
  } catch (error) {
    console.error('Error obteniendo tareas vencidas:', error)
    return getOverdueTasksJSON()
  }
}

