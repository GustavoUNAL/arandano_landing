'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ExpenseType = 'fixed' | 'variable'
type ExpenseCategory = 
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

interface Expense {
  id: string
  date: string
  type: ExpenseType
  category: ExpenseCategory
  description: string
  amount: number
  notes?: string
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Arriendo',
  utilities: 'Servicios',
  internet: 'Internet',
  staff: 'Personal',
  software: 'Software / Hosting',
  alcohol: 'Bebidas Alcohólicas',
  coffee: 'Café',
  supplies: 'Insumos',
  delivery: 'Domicilios',
  other: 'Otros'
}

export default function ExpensesPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'fixed' as ExpenseType,
    category: 'rent' as ExpenseCategory,
    description: '',
    amount: '',
    notes: ''
  })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadExpenses()
    }
  }, [isAuthenticated])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/login')
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
    } catch (error) {
      setIsAuthenticated(false)
    }
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  const loadExpenses = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/expenses')
      const data = await response.json()
      setExpenses(data.sort((a: Expense, b: Expense) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ))
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingExpense) {
        const response = await fetch(`/api/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            amount: Number(formData.amount)
          })
        })
        if (response.ok) {
          await loadExpenses()
          resetForm()
          showAlert('success', 'Gasto actualizado exitosamente')
        }
      } else {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            amount: Number(formData.amount)
          })
        })
        if (response.ok) {
          await loadExpenses()
          resetForm()
          showAlert('success', 'Gasto creado exitosamente')
        }
      }
    } catch (error) {
      showAlert('error', 'Error al guardar gasto')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await loadExpenses()
        showAlert('success', 'Gasto eliminado exitosamente')
      }
    } catch (error) {
      showAlert('error', 'Error al eliminar gasto')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingExpense(null)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'fixed',
      category: 'rent',
      description: '',
      amount: '',
      notes: ''
    })
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-berry-600">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/admin')
    return null
  }

  const fixedExpenses = expenses.filter(e => e.type === 'fixed')
  const variableExpenses = expenses.filter(e => e.type === 'variable')
  const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalVariable = variableExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {alert && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 ${
            alert.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          } animate-fade-in-up`}>
            <span className="text-xl font-bold">{alert.type === 'success' ? '✓' : '✕'}</span>
            <span className="font-medium">{alert.message}</span>
            <button onClick={() => setAlert(null)} className="ml-4 text-white hover:text-stone-200">✕</button>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-berry-950">💰 Gestión de Gastos</h1>
          <Link href="/admin" className="px-4 py-2 text-berry-600 hover:text-berry-800 text-sm font-medium">
            ← Volver a Admin
          </Link>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-berry-600 mb-2">Gastos Fijos</div>
            <div className="text-2xl font-bold text-berry-950">
              ${totalFixed.toLocaleString('es-CO')}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-berry-600 mb-2">Gastos Variables</div>
            <div className="text-2xl font-bold text-berry-950">
              ${totalVariable.toLocaleString('es-CO')}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-berry-600 mb-2">Total</div>
            <div className="text-2xl font-bold text-berry-950">
              ${(totalFixed + totalVariable).toLocaleString('es-CO')}
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-berry-950 mb-4">
            {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Fecha *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Tipo *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ExpenseType })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
                required
              >
                <option value="fixed">Fijo</option>
                <option value="variable">Variable</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Categoría *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
                required
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Monto (COP) *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
                required
                min="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-berry-700 mb-2">Descripción *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-berry-700 mb-2">Notas</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {editingExpense ? 'Actualizar' : 'Crear'} Gasto
              </button>
              {editingExpense && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Gastos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-berry-950 mb-4">Gastos Registrados</h2>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-berry-600">No hay gastos registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Categoría</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Descripción</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Monto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-stone-200 hover:bg-stone-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(expense.date).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          expense.type === 'fixed' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {expense.type === 'fixed' ? 'Fijo' : 'Variable'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{CATEGORY_LABELS[expense.category]}</td>
                      <td className="px-4 py-3 text-sm">{expense.description}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        ${expense.amount.toLocaleString('es-CO')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingExpense(expense)
                              setFormData({
                                date: expense.date.split('T')[0],
                                type: expense.type,
                                category: expense.category,
                                description: expense.description,
                                amount: expense.amount.toString(),
                                notes: expense.notes || ''
                              })
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className="px-3 py-1 bg-berry-600 hover:bg-berry-700 text-white rounded text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

