/**
 * Servicio de gastos usando Firebase Firestore
 * Mantiene compatibilidad con la interfaz existente
 */

import admin from 'firebase-admin'
import { db } from './firebase-admin'
import { Expense, ExpenseType, ExpenseCategory } from './expenses'
import { getDbMode, isDbAvailable } from './db-utils'

// Re-exportar tipos
export type { Expense, ExpenseType, ExpenseCategory } from './expenses'

// Tipo helper para documentos de Firestore
type FirestoreExpense = Omit<Expense, 'id'>
type FirestoreDocument = admin.firestore.QueryDocumentSnapshot<FirestoreExpense>
type FirestoreDocumentSnapshot = admin.firestore.DocumentSnapshot<FirestoreExpense>

// Función helper para convertir documento a Expense
function documentToExpense(doc: FirestoreDocument | FirestoreDocumentSnapshot): Expense {
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
import { getExpenses as getExpensesJSON, saveExpenses as saveExpensesJSON, createExpense as createExpenseJSON, updateExpense as updateExpenseJSON, deleteExpense as deleteExpenseJSON, getExpensesByDateRange as getExpensesByDateRangeJSON, getMonthlyFixedExpenses as getMonthlyFixedExpensesJSON } from './expenses'

export async function getExpenses(): Promise<Expense[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getExpensesJSON()
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }
  
  try {
    const snapshot = await db.collection('expenses').orderBy('date', 'desc').get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToExpense(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo gastos de Firebase:', error)
    throw error
  }
}

export async function createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const mode = getDbMode()
  const newExpense: Expense = {
    ...expense,
    id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  if (mode === 'json') {
    return createExpenseJSON(expense)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('expenses').doc(newExpense.id).set(newExpense)
    return newExpense
  } catch (error) {
    console.error('[DB] Error creando gasto en Firebase:', error)
    throw error
  }
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return updateExpenseJSON(id, updates)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const docRef = db.collection('expenses').doc(id)
    await docRef.update(updates)
    
    const updated = await docRef.get() as FirestoreDocumentSnapshot
    if (!updated.exists) return null
    
    return documentToExpense(updated)
  } catch (error) {
    console.error('[DB] Error actualizando gasto en Firebase:', error)
    throw error
  }
}

export async function deleteExpense(id: string): Promise<boolean> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return deleteExpenseJSON(id)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('expenses').doc(id).delete()
    return true
  } catch (error) {
    console.error('[DB] Error eliminando gasto de Firebase:', error)
    throw error
  }
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getExpensesByDateRangeJSON(startDate, endDate)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const snapshot = await db.collection('expenses')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToExpense(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo gastos por rango de Firebase:', error)
    throw error
  }
}

export async function getMonthlyFixedExpenses(year: number, month: number): Promise<Expense[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getMonthlyFixedExpensesJSON(year, month)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const startDate = new Date(year, month, 1).toISOString()
    const endDate = new Date(year, month + 1, 0).toISOString()
    
    const snapshot = await db.collection('expenses')
      .where('type', '==', 'fixed')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToExpense(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo gastos fijos mensuales de Firebase:', error)
    throw error
  }
}

