'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState({
    type: '' as '' | ExpenseType,
    category: '' as '' | ExpenseCategory,
    dateFrom: '',
    dateTo: ''
  })
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
        } else {
          showAlert('error', 'Error al actualizar gasto')
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
        } else {
          showAlert('error', 'Error al crear gasto')
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
      } else {
        showAlert('error', 'Error al eliminar gasto')
      }
    } catch (error) {
      showAlert('error', 'Error al eliminar gasto')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingExpense(null)
    setShowAddModal(false)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'fixed',
      category: 'rent',
      description: '',
      amount: '',
      notes: ''
    })
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowAddModal(true)
    setFormData({
      date: expense.date.split('T')[0],
      type: expense.type,
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      notes: expense.notes || ''
    })
  }

  const clearFilters = () => {
    setFilter({
      type: '',
      category: '',
      dateFrom: '',
      dateTo: ''
    })
    setSearchTerm('')
  }

  // Filtrar gastos
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      CATEGORY_LABELS[expense.category].toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filter.type === '' || expense.type === filter.type
    const matchesCategory = filter.category === '' || expense.category === filter.category
    const matchesDateFrom = filter.dateFrom === '' || expense.date >= filter.dateFrom
    const matchesDateTo = filter.dateTo === '' || expense.date <= filter.dateTo

    return matchesSearch && matchesType && matchesCategory && matchesDateFrom && matchesDateTo
  })

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-arandano-600">Cargando...</div>
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
  const totalExpenses = totalFixed + totalVariable

  // Calcular gastos del mes actual
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const currentMonthExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })
  const totalCurrentMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)

  const hasActiveFilters = filter.type !== '' || filter.category !== '' || filter.dateFrom !== '' || filter.dateTo !== '' || searchTerm !== ''

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 py-6 px-4">
        <div className="max-w-7xl mx-auto">
        {alert && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 transform transition-all duration-300 ease-in-out ${
            alert.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          } animate-fade-in-up`}>
            <span className="text-xl font-bold">{alert.type === 'success' ? '✓' : '✕'}</span>
            <span className="font-medium">{alert.message}</span>
            <button onClick={() => setAlert(null)} className="ml-4 text-white hover:text-stone-200 transition-colors" aria-label="Cerrar alerta">✕</button>
          </div>
        )}

        {/* Header con título centrado */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-arandano-950 text-center mb-4">
            Gestión de Gastos
          </h1>

          {/* Barra de búsqueda y configuración */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="Buscar gastos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500 text-sm"
            />
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-3 bg-arandano-600 hover:bg-arandano-700 text-white rounded-xl transition-colors"
              aria-label="Configuración"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Resumen mejorado - Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {/* Fila 1 */}
          <div className="bg-arandano-50 rounded-xl border-2 border-arandano-200 p-4 sm:p-5">
            <div className="text-xs sm:text-sm text-arandano-700 font-medium mb-1">Gastos Fijos</div>
            <div className="text-xl sm:text-2xl font-bold text-arandano-950">
              ${totalFixed.toLocaleString('es-CO')}
            </div>
          </div>
          <div className="bg-arandano-50 rounded-xl border-2 border-arandano-200 p-4 sm:p-5">
            <div className="text-xs sm:text-sm text-arandano-700 font-medium mb-1">Gastos Variables</div>
            <div className="text-xl sm:text-2xl font-bold text-arandano-950">
              ${totalVariable.toLocaleString('es-CO')}
            </div>
          </div>
          {/* Fila 2 */}
          <div className="bg-arandano-50 rounded-xl border-2 border-arandano-200 p-4 sm:p-5">
            <div className="text-xs sm:text-sm text-arandano-700 font-medium mb-1">Total</div>
            <div className="text-xl sm:text-2xl font-bold text-arandano-950">
              ${totalExpenses.toLocaleString('es-CO')}
            </div>
          </div>
          <div className="bg-arandano-50 rounded-xl border-2 border-arandano-200 p-4 sm:p-5">
            <div className="text-xs sm:text-sm text-arandano-700 font-medium mb-1">Este Mes</div>
            <div className="text-xl sm:text-2xl font-bold text-arandano-950">
              ${totalCurrentMonth.toLocaleString('es-CO')}
            </div>
          </div>
        </div>

        {/* Lista de Gastos */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-arandano-950">
              Gastos Registrados {filteredExpenses.length !== expenses.length && `(${filteredExpenses.length} de ${expenses.length})`}
            </h2>
          </div>
          {loading ? (
            <div className="text-center py-8 text-arandano-600">Cargando...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-arandano-600">
              {hasActiveFilters ? 'No se encontraron gastos con los filtros aplicados' : 'No hay gastos registrados'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="bg-gradient-to-br from-white to-stone-50 border-2 border-stone-200 rounded-xl p-5 sm:p-6 hover:shadow-lg transition-all hover:border-arandano-300 hover:shadow-berry-100"
                >
                  {/* Header: Descripción y Monto */}
                  <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-stone-200">
                    <h3 className="font-bold text-arandano-950 text-lg sm:text-xl flex-1 leading-tight">
                      {expense.description}
                    </h3>
                    <div className="text-2xl sm:text-3xl font-bold text-arandano-600 whitespace-nowrap">
                      ${expense.amount.toLocaleString('es-CO')}
                    </div>
                  </div>

                  {/* Información: Badges y Fecha */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      expense.type === 'fixed' 
? 'bg-arandano-100 text-arandano-800 border-2 border-arandano-300'
                        : 'bg-arandano-100 text-arandano-800 border-2 border-arandano-300'
                    }`}>
                      {expense.type === 'fixed' ? 'Fijo' : 'Variable'}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 border-2 border-stone-300">
                      {CATEGORY_LABELS[expense.category]}
                    </span>
                    <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 text-stone-700 border-2 border-stone-300">
                      📅 {new Date(expense.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Notas (si existen) */}
                  {expense.notes && (
                    <div className="mb-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-700 italic leading-relaxed">
                        {expense.notes}
                      </p>
                    </div>
                  )}

                  {/* Acciones: Botones Editar y Eliminar */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="w-11 h-11 flex items-center justify-center bg-arandano-600 hover:bg-arandano-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-110 active:scale-95"
                      title="Editar"
                      aria-label="Editar gasto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="w-11 h-11 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-110 active:scale-95"
                      title="Eliminar"
                      aria-label="Eliminar gasto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Configuración */}
        {showConfigModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfigModal(false)}
          >
            <div 
              className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-arandano-950">Configuración</h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-stone-500 hover:text-stone-700 text-2xl leading-none w-7 h-7 flex items-center justify-center"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Nueva Gasto */}
                <button
                  onClick={() => {
                    setShowConfigModal(false)
                    resetForm()
                    setShowAddModal(true)
                  }}
                  className="w-full px-4 py-3 rounded-lg font-semibold transition-all text-left bg-arandano-600 text-white shadow-md hover:bg-arandano-700 active:bg-arandano-800 text-sm"
                >
                  Nuevo Gasto
                </button>

                {/* Filtros */}
                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <div className="text-xs font-semibold text-stone-700 mb-3">Filtros</div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1.5">Tipo</label>
                      <select
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value as '' | ExpenseType })}
                        className="w-full px-3 py-2 text-xs border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500"
                      >
                        <option value="">Todos</option>
                        <option value="fixed">Fijo</option>
                        <option value="variable">Variable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1.5">Categoría</label>
                      <select
                        value={filter.category}
                        onChange={(e) => setFilter({ ...filter, category: e.target.value as '' | ExpenseCategory })}
                        className="w-full px-3 py-2 text-xs border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500"
                      >
                        <option value="">Todas</option>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1.5">Desde</label>
                        <input
                          type="date"
                          value={filter.dateFrom}
                          onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                          className="w-full px-2 py-2 text-xs border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1.5">Hasta</label>
                        <input
                          type="date"
                          value={filter.dateTo}
                          onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                          className="w-full px-2 py-2 text-xs border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Limpiar Filtros */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2.5 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-semibold rounded-lg transition-colors text-sm"
                  >
                    Limpiar Filtros
                  </button>
                )}

                {/* Estadísticas */}
                <div className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                  <div className="text-xs font-semibold text-stone-700 mb-2">Estadísticas</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Total gastos:</span>
                      <span className="font-semibold text-arandano-950">{expenses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Fijos:</span>
                      <span className="font-semibold text-arandano-700">{fixedExpenses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Variables:</span>
                      <span className="font-semibold text-arandano-700">{variableExpenses.length}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfigModal(false)}
                  className="w-full px-4 py-2.5 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-semibold rounded-lg transition-colors text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Nuevo/Editar Gasto */}
        {(showAddModal || editingExpense) && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (!loading) {
                resetForm()
              }
            }}
          >
            <div 
              className="bg-white rounded-2xl p-4 sm:p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-arandano-950">
                  {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-stone-500 hover:text-stone-700 text-2xl leading-none w-7 h-7 flex items-center justify-center"
                  aria-label="Cerrar"
                  disabled={loading}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-arandano-700 mb-1.5">Fecha *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-arandano-700 mb-1.5">Tipo *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ExpenseType })}
                      className="w-full px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500"
                      required
                    >
                      <option value="fixed">Fijo</option>
                      <option value="variable">Variable</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-arandano-700 mb-1.5">Categoría *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                      className="w-full px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500"
                      required
                    >
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-arandano-700 mb-1.5">Monto (COP) *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500"
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-arandano-700 mb-1.5">Descripción *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-arandano-700 mb-1.5">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500 focus:border-arandano-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-sm border-2 border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.description || !formData.amount}
                    className="flex-1 px-4 py-2.5 text-sm bg-arandano-600 hover:bg-arandano-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {loading ? 'Guardando...' : editingExpense ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Botón flotante para registrar gasto */}
        <button
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-arandano-600 hover:bg-arandano-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center z-40"
          title="Registrar Nuevo Gasto"
          aria-label="Registrar Nuevo Gasto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        </div>
      </main>
    </div>
  )
}
