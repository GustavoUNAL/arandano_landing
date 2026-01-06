/**
 * Servicio de gastos usando Firebase Firestore
 * Mantiene compatibilidad con la interfaz existente
 */

import { db } from './firebase-admin'
import { Expense, ExpenseType, ExpenseCategory } from './expenses'
import { isDbAvailable } from './db-utils'

// Re-exportar tipos
export type { Expense, ExpenseType, ExpenseCategory } from './expenses'

// Modo: 'firebase' | 'json' | 'hybrid'
const DB_MODE = (process.env.DB_MODE || 'firebase') as 'firebase' | 'json' | 'hybrid'

// Importar funciones JSON como fallback
import { getExpenses as getExpensesJSON, saveExpenses as saveExpensesJSON, createExpense as createExpenseJSON, updateExpense as updateExpenseJSON, deleteExpense as deleteExpenseJSON, getExpensesByDateRange as getExpensesByDateRangeJSON, getMonthlyFixedExpenses as getMonthlyFixedExpensesJSON } from './expenses'

export async function getExpenses(): Promise<Expense[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getExpensesJSON()
  }

  try {
    if (DB_MODE === 'firebase') {
      const snapshot = await db.collection('expenses').orderBy('date', 'desc').get()
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Expense))
    } else {
      try {
        const snapshot = await db.collection('expenses').orderBy('date', 'desc').get()
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Expense))
      } catch (error) {
        console.warn('Error leyendo de Firestore, usando JSON:', error)
        return getExpensesJSON()
      }
    }
  } catch (error) {
    console.error('Error obteniendo gastos:', error)
    return getExpensesJSON()
  }
}

export async function createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const newExpense: Expense = {
    ...expense,
    id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  if (DB_MODE === 'json' || !isDbAvailable()) {
    return createExpenseJSON(expense)
  }

  try {
    if (!isDbAvailable()) {
      return createExpenseJSON(expense)
    }
    await db.collection('expenses').doc(newExpense.id).set(newExpense)
    
    if (DB_MODE === 'hybrid') {
      const expenses = getExpensesJSON()
      expenses.push(newExpense)
      saveExpensesJSON(expenses)
    }
    
    return newExpense
  } catch (error) {
    console.error('Error creando gasto:', error)
    return createExpenseJSON(expense)
  }
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return updateExpenseJSON(id, updates)
  }

  try {
    if (!isDbAvailable()) {
      return updateExpenseJSON(id, updates)
    }
    const docRef = db.collection('expenses').doc(id)
    await docRef.update(updates)
    
    const updated = await docRef.get()
    if (!updated.exists) return null
    
    const updatedExpense = { id: updated.id, ...updated.data() } as Expense
    
    if (DB_MODE === 'hybrid') {
      const expenses = getExpensesJSON()
      const index = expenses.findIndex(e => e.id === id)
      if (index !== -1) {
        expenses[index] = updatedExpense
        saveExpensesJSON(expenses)
      }
    }
    
    return updatedExpense
  } catch (error) {
    console.error('Error actualizando gasto:', error)
    return updateExpenseJSON(id, updates)
  }
}

export async function deleteExpense(id: string): Promise<boolean> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return deleteExpenseJSON(id)
  }

  try {
    if (!isDbAvailable()) {
      return deleteExpenseJSON(id)
    }
    await db.collection('expenses').doc(id).delete()
    
    if (DB_MODE === 'hybrid') {
      const expenses = getExpensesJSON()
      const filtered = expenses.filter(e => e.id !== id)
      saveExpensesJSON(filtered)
    }
    
    return true
  } catch (error) {
    console.error('Error eliminando gasto:', error)
    return deleteExpenseJSON(id)
  }
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getExpensesByDateRangeJSON(startDate, endDate)
  }

  try {
    if (!isDbAvailable()) {
      return getExpensesByDateRangeJSON(startDate, endDate)
    }
    const snapshot = await db.collection('expenses')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .get()
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Expense))
  } catch (error) {
    console.error('Error obteniendo gastos por rango:', error)
    return getExpensesByDateRangeJSON(startDate, endDate)
  }
}

export async function getMonthlyFixedExpenses(year: number, month: number): Promise<Expense[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getMonthlyFixedExpensesJSON(year, month)
  }

  try {
    if (!isDbAvailable()) {
      return getMonthlyFixedExpensesJSON(year, month)
    }
    const startDate = new Date(year, month, 1).toISOString()
    const endDate = new Date(year, month + 1, 0).toISOString()
    
    const snapshot = await db.collection('expenses')
      .where('type', '==', 'fixed')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get()
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Expense))
  } catch (error) {
    console.error('Error obteniendo gastos fijos mensuales:', error)
    return getMonthlyFixedExpensesJSON(year, month)
  }
}

