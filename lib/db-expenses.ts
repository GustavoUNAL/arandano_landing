/**
 * Servicio de gastos usando SQLite
 * Mantiene compatibilidad con la interfaz existente
 */

import { Expense, ExpenseType, ExpenseCategory } from './expenses'
import { getDbMode } from './db-utils'
import { getDatabase } from './db-sqlite'

// Re-exportar tipos
export type { Expense, ExpenseType, ExpenseCategory } from './expenses'

// Importar funciones JSON (solo si DB_MODE === 'json')
import { getExpenses as getExpensesJSON, saveExpenses as saveExpensesJSON, createExpense as createExpenseJSON, updateExpense as updateExpenseJSON, deleteExpense as deleteExpenseJSON, getExpensesByDateRange as getExpensesByDateRangeJSON, getMonthlyFixedExpenses as getMonthlyFixedExpensesJSON } from './expenses'

export async function getExpenses(): Promise<Expense[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getExpensesJSON()
  }
  
  if (mode === 'sqlite') {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all() as any[]
    return rows.map(row => ({
      id: row.id,
      description: row.description,
      amount: row.amount,
      date: row.date,
      category: row.category as ExpenseCategory,
      type: row.type as ExpenseType,
      notes: row.notes || undefined
    }))
  }
  
  // Por defecto: SQLite
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all() as any[]
  return rows.map(row => ({
    id: row.id,
    description: row.description,
    amount: row.amount,
    date: row.date,
    category: row.category as ExpenseCategory,
    type: row.type as ExpenseType,
    notes: row.notes || undefined
  }))
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
  
  const db = getDatabase()
  db.prepare(`
    INSERT INTO expenses (id, description, amount, date, category, type, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newExpense.id,
    newExpense.description,
    newExpense.amount,
    newExpense.date,
    newExpense.category,
    newExpense.type,
    newExpense.notes || null,
    new Date().toISOString()
  )
  
  return newExpense
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return updateExpenseJSON(id, updates)
  }
  
  const db = getDatabase()
  const fields: string[] = []
  const values: any[] = []
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })
  
  if (fields.length === 0) {
    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      id: row.id,
      description: row.description,
      amount: row.amount,
      date: row.date,
      category: row.category as ExpenseCategory,
      type: row.type as ExpenseType,
      notes: row.notes || undefined
    }
  }
  
  values.push(id)
  db.prepare(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as any
  if (!row) return null
  
  return {
    id: row.id,
    description: row.description,
    amount: row.amount,
    date: row.date,
    category: row.category as ExpenseCategory,
    type: row.type as ExpenseType,
    notes: row.notes || undefined
  }
}

export async function deleteExpense(id: string): Promise<boolean> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return deleteExpenseJSON(id)
  }
  
  const db = getDatabase()
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
  return result.changes > 0
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getExpensesByDateRangeJSON(startDate, endDate)
  }
  
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM expenses 
    WHERE date >= ? AND date <= ?
    ORDER BY date DESC
  `).all(startDate, endDate) as any[]
  return rows.map(row => ({
    id: row.id,
    description: row.description,
    amount: row.amount,
    date: row.date,
    category: row.category as ExpenseCategory,
    type: row.type as ExpenseType,
    notes: row.notes || undefined
  }))
}

export async function getMonthlyFixedExpenses(year: number, month: number): Promise<Expense[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getMonthlyFixedExpensesJSON(year, month)
  }
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM expenses 
    WHERE type = ? AND date >= ? AND date <= ?
    ORDER BY date DESC
  `).all('fixed', startDate, endDate) as any[]
  
  return rows.map(row => ({
    id: row.id,
    description: row.description,
    amount: row.amount,
    date: row.date,
    category: row.category as ExpenseCategory,
    type: row.type as ExpenseType,
    notes: row.notes || undefined
  }))
}
