/**
 * Servicio de gastos (SQLite / PostgreSQL / JSON)
 */

import { Expense, ExpenseType, ExpenseCategory } from './expenses'
import { getDbMode } from './db-utils'
import { dbAll, dbGet, dbRun } from './db'

export type { Expense, ExpenseType, ExpenseCategory } from './expenses'

import {
  getExpenses as getExpensesJSON,
  createExpense as createExpenseJSON,
  updateExpense as updateExpenseJSON,
  deleteExpense as deleteExpenseJSON,
  getExpensesByDateRange as getExpensesByDateRangeJSON,
  getMonthlyFixedExpenses as getMonthlyFixedExpensesJSON,
} from './expenses'

function mapExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    description: row.description as string,
    amount: row.amount as number,
    date: row.date as string,
    category: row.category as ExpenseCategory,
    type: row.type as ExpenseType,
    notes: (row.notes as string) || undefined,
  }
}

export async function getExpenses(): Promise<Expense[]> {
  if (getDbMode() === 'json') return getExpensesJSON()
  const rows = await dbAll<Record<string, unknown>>('SELECT * FROM expenses ORDER BY date DESC')
  return rows.map(mapExpense)
}

export async function createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const newExpense: Expense = {
    ...expense,
    id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }

  if (getDbMode() === 'json') return createExpenseJSON(expense)

  await dbRun(
    `INSERT INTO expenses (id, description, amount, date, category, type, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newExpense.id,
      newExpense.description,
      newExpense.amount,
      newExpense.date,
      newExpense.category,
      newExpense.type,
      newExpense.notes || null,
      new Date().toISOString(),
    ]
  )

  return newExpense
}

export async function updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
  if (getDbMode() === 'json') return updateExpenseJSON(id, updates)

  const fields: string[] = []
  const values: unknown[] = []

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })

  if (fields.length === 0) {
    const row = await dbGet<Record<string, unknown>>('SELECT * FROM expenses WHERE id = ?', [id])
    if (!row) return null
    return mapExpense(row)
  }

  values.push(id)
  await dbRun(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`, values)

  const row = await dbGet<Record<string, unknown>>('SELECT * FROM expenses WHERE id = ?', [id])
  if (!row) return null
  return mapExpense(row)
}

export async function deleteExpense(id: string): Promise<boolean> {
  if (getDbMode() === 'json') return deleteExpenseJSON(id)
  const result = await dbRun('DELETE FROM expenses WHERE id = ?', [id])
  return result.changes > 0
}

export async function getExpensesByDateRange(
  startDate: string,
  endDate: string
): Promise<Expense[]> {
  if (getDbMode() === 'json') return getExpensesByDateRangeJSON(startDate, endDate)
  const rows = await dbAll<Record<string, unknown>>(
    `SELECT * FROM expenses 
    WHERE date >= ? AND date <= ?
    ORDER BY date DESC`,
    [startDate, endDate]
  )
  return rows.map(mapExpense)
}

export async function getMonthlyFixedExpenses(year: number, month: number): Promise<Expense[]> {
  if (getDbMode() === 'json') return getMonthlyFixedExpensesJSON(year, month)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]
  const rows = await dbAll<Record<string, unknown>>(
    `SELECT * FROM expenses 
    WHERE type = ? AND date >= ? AND date <= ?
    ORDER BY date DESC`,
    ['fixed', startDate, endDate]
  )
  return rows.map(mapExpense)
}
