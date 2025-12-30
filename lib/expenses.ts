import fs from 'fs'
import path from 'path'

export type ExpenseType = 'fixed' | 'variable'
export type ExpenseCategory = 
  | 'rent' 
  | 'utilities' 
  | 'internet' 
  | 'staff' 
  | 'software' 
  | 'alcohol' 
  | 'coffee' 
  | 'supplies' 
  | 'delivery'
  | 'other'

export interface Expense {
  id: string
  date: string // ISO string
  type: ExpenseType
  category: ExpenseCategory
  description: string
  amount: number
  notes?: string
}

const expensesFilePath = path.join(process.cwd(), 'data', 'expenses.json')

export function getExpenses(): Expense[] {
  try {
    if (!fs.existsSync(expensesFilePath)) {
      return []
    }
    const fileContents = fs.readFileSync(expensesFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    console.error('Error reading expenses file:', error)
    return []
  }
}

export function saveExpenses(expenses: Expense[]): void {
  try {
    fs.writeFileSync(expensesFilePath, JSON.stringify(expenses, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing expenses file:', error)
    throw error
  }
}

export function createExpense(expense: Omit<Expense, 'id'>): Expense {
  const expenses = getExpenses()
  const newExpense: Expense = {
    ...expense,
    id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  expenses.push(newExpense)
  saveExpenses(expenses)
  return newExpense
}

export function updateExpense(id: string, updates: Partial<Expense>): Expense | null {
  const expenses = getExpenses()
  const index = expenses.findIndex(e => e.id === id)
  if (index === -1) return null
  
  expenses[index] = { ...expenses[index], ...updates }
  saveExpenses(expenses)
  return expenses[index]
}

export function deleteExpense(id: string): boolean {
  const expenses = getExpenses()
  const filtered = expenses.filter(e => e.id !== id)
  if (filtered.length === expenses.length) return false
  
  saveExpenses(filtered)
  return true
}

export function getExpensesByDateRange(startDate: string, endDate: string): Expense[] {
  const expenses = getExpenses()
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    const start = new Date(startDate)
    const end = new Date(endDate)
    return expenseDate >= start && expenseDate <= end
  })
}

export function getMonthlyFixedExpenses(year: number, month: number): Expense[] {
  const expenses = getExpenses()
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expense.type === 'fixed' && 
           expenseDate.getFullYear() === year && 
           expenseDate.getMonth() === month
  })
}

