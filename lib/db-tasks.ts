/**
 * Servicio de tareas usando Firebase Firestore
 * Mantiene compatibilidad con la interfaz existente
 */

import admin from 'firebase-admin'
import { db } from './firebase-admin'
import { Task, TaskCategory, TaskPriority } from './tasks'
import { getDbMode, isDbAvailable } from './db-utils'

// Re-exportar tipos
export type { Task, TaskCategory, TaskPriority } from './tasks'

// Tipo helper para documentos de Firestore
type FirestoreTask = Omit<Task, 'id'>
type FirestoreDocument = admin.firestore.QueryDocumentSnapshot<FirestoreTask>
type FirestoreDocumentSnapshot = admin.firestore.DocumentSnapshot<FirestoreTask>

// Función helper para convertir documento a Task
function documentToTask(doc: FirestoreDocument | FirestoreDocumentSnapshot): Task {
  const data = doc.data()
  if (!data) {
    throw new Error('Document data is undefined')
  }
  return {
    id: doc.id,
    ...data
  }
}

// Importar funciones JSON (solo si DB_MODE === 'json')
import { getTasks as getTasksJSON, saveTasks as saveTasksJSON, createTask as createTaskJSON, updateTask as updateTaskJSON, deleteTask as deleteTaskJSON, getTasksByCategory as getTasksByCategoryJSON, getTasksByPriority as getTasksByPriorityJSON, getOverdueTasks as getOverdueTasksJSON } from './tasks'

export async function getTasks(): Promise<Task[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getTasksJSON()
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }
  
  try {
    const snapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToTask(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo tareas de Firebase:', error)
    throw error
  }
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
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('tasks').doc(newTask.id).set(newTask)
    return newTask
  } catch (error) {
    console.error('[DB] Error creando tarea en Firebase:', error)
    throw error
  }
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return updateTaskJSON(id, updates)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
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
    
    const updated = await docRef.get() as FirestoreDocumentSnapshot
    if (!updated.exists) return null
    
    return documentToTask(updated)
  } catch (error) {
    console.error('[DB] Error actualizando tarea en Firebase:', error)
    throw error
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return deleteTaskJSON(id)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('tasks').doc(id).delete()
    return true
  } catch (error) {
    console.error('[DB] Error eliminando tarea de Firebase:', error)
    throw error
  }
}

export async function getTasksByCategory(category: TaskCategory): Promise<Task[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getTasksByCategoryJSON(category)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const snapshot = await db.collection('tasks')
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToTask(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo tareas por categoría de Firebase:', error)
    throw error
  }
}

export async function getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getTasksByPriorityJSON(priority)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const snapshot = await db.collection('tasks')
      .where('priority', '==', priority)
      .orderBy('createdAt', 'desc')
      .get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToTask(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo tareas por prioridad de Firebase:', error)
    throw error
  }
}

export async function getOverdueTasks(): Promise<Task[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getOverdueTasksJSON()
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const now = new Date().toISOString()
    const snapshot = await db.collection('tasks')
      .where('completed', '==', false)
      .where('dueDate', '<', now)
      .get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToTask(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo tareas vencidas de Firebase:', error)
    throw error
  }
}

