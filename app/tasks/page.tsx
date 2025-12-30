'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type TaskCategory = 
  | 'inventario'
  | 'compras'
  | 'mantenimiento'
  | 'marketing'
  | 'finanzas'
  | 'personal'
  | 'operaciones'
  | 'limpieza'
  | 'eventos'
  | 'otro'

type TaskPriority = 'baja' | 'media' | 'alta' | 'urgente'

interface Task {
  id: string
  title: string
  description?: string
  category: TaskCategory
  priority: TaskPriority
  completed: boolean
  dueDate?: string
  createdAt: string
  completedAt?: string
  assignedTo?: string
  tags?: string[]
}

const CATEGORY_LABELS: Record<TaskCategory, { label: string; icon: string; color: string }> = {
  inventario: { label: 'Inventario', icon: '📦', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  compras: { label: 'Compras', icon: '🛒', color: 'bg-green-100 text-green-800 border-green-300' },
  mantenimiento: { label: 'Mantenimiento', icon: '🔧', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  marketing: { label: 'Marketing', icon: '📢', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  finanzas: { label: 'Finanzas', icon: '💰', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  personal: { label: 'Personal', icon: '👥', color: 'bg-pink-100 text-pink-800 border-pink-300' },
  operaciones: { label: 'Operaciones', icon: '☕', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  limpieza: { label: 'Limpieza', icon: '🧹', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  eventos: { label: 'Eventos', icon: '🎉', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  otro: { label: 'Otro', icon: '📝', color: 'bg-gray-100 text-gray-800 border-gray-300' }
}

const PRIORITY_LABELS: Record<TaskPriority, { label: string; color: string }> = {
  baja: { label: 'Baja', color: 'bg-gray-200 text-gray-700' },
  media: { label: 'Media', color: 'bg-blue-200 text-blue-700' },
  alta: { label: 'Alta', color: 'bg-orange-200 text-orange-700' },
  urgente: { label: 'Urgente', color: 'bg-red-200 text-red-700' }
}

export default function TasksPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [filter, setFilter] = useState<{
    category: TaskCategory | 'all'
    priority: TaskPriority | 'all'
    completed: 'all' | 'pending' | 'completed'
  }>({
    category: 'all',
    priority: 'all',
    completed: 'pending'
  })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'inventario' as TaskCategory,
    priority: 'media' as TaskPriority,
    dueDate: '',
    assignedTo: '',
    tags: ''
  })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks()
    }
  }, [isAuthenticated, filter])

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

  const loadTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.category !== 'all') params.append('category', filter.category)
      if (filter.priority !== 'all') params.append('priority', filter.priority)
      if (filter.completed !== 'all') {
        params.append('completed', filter.completed === 'completed' ? 'true' : 'false')
      }
      
      const response = await fetch(`/api/tasks?${params.toString()}`)
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingTask) {
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
          })
        })
        if (response.ok) {
          await loadTasks()
          resetForm()
          showAlert('success', 'Tarea actualizada exitosamente')
        }
      } else {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
          })
        })
        if (response.ok) {
          await loadTasks()
          resetForm()
          showAlert('success', 'Tarea creada exitosamente')
        }
      }
    } catch (error) {
      showAlert('error', 'Error al guardar tarea')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (task: Task) => {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      })
      await loadTasks()
    } catch (error) {
      showAlert('error', 'Error al actualizar tarea')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await loadTasks()
        showAlert('success', 'Tarea eliminada exitosamente')
      }
    } catch (error) {
      showAlert('error', 'Error al eliminar tarea')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingTask(null)
    setFormData({
      title: '',
      description: '',
      category: 'inventario',
      priority: 'media',
      dueDate: '',
      assignedTo: '',
      tags: ''
    })
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedTo: task.assignedTo || '',
      tags: task.tags?.join(', ') || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && !editingTask?.completed
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

  const pendingTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate))

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
          <h1 className="text-3xl font-bold text-berry-950">✅ Lista de Tareas</h1>
          <Link href="/admin" className="px-4 py-2 text-berry-600 hover:text-berry-800 text-sm font-medium">
            ← Volver a Admin
          </Link>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-sm text-berry-600 mb-1">Pendientes</div>
            <div className="text-2xl font-bold text-berry-950">{pendingTasks.length}</div>
          </div>
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <div className="text-sm text-red-600 mb-1">Vencidas</div>
            <div className="text-2xl font-bold text-red-700">{overdueTasks.length}</div>
          </div>
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
            <div className="text-sm text-green-600 mb-1">Completadas</div>
            <div className="text-2xl font-bold text-green-700">{completedTasks.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="text-sm text-berry-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-berry-950">{tasks.length}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Categoría</label>
              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value as TaskCategory | 'all' })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
              >
                <option value="all">Todas</option>
                {Object.entries(CATEGORY_LABELS).map(([value, { label, icon }]) => (
                  <option key={value} value={value}>{icon} {label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Prioridad</label>
              <select
                value={filter.priority}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value as TaskPriority | 'all' })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
              >
                <option value="all">Todas</option>
                {Object.entries(PRIORITY_LABELS).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Estado</label>
              <select
                value={filter.completed}
                onChange={(e) => setFilter({ ...filter, completed: e.target.value as 'all' | 'pending' | 'completed' })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
              >
                <option value="pending">Pendientes</option>
                <option value="completed">Completadas</option>
                <option value="all">Todas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-berry-950 mb-4">
            {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-berry-700 mb-2">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-berry-700 mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Categoría *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
                required
              >
                {Object.entries(CATEGORY_LABELS).map(([value, { label, icon }]) => (
                  <option key={value} value={value}>{icon} {label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Prioridad *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
                required
              >
                {Object.entries(PRIORITY_LABELS).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Fecha Límite</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">Asignado a</label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Ej: Juan, María"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-berry-700 mb-2">Tags (separados por comas)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Ej: urgente, proveedor, limpieza"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500"
              />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {editingTask ? 'Actualizar' : 'Crear'} Tarea
              </button>
              {editingTask && (
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

        {/* Lista de Tareas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-berry-950 mb-4">
            Tareas {filter.completed === 'pending' ? 'Pendientes' : filter.completed === 'completed' ? 'Completadas' : ''}
          </h2>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-berry-600">No hay tareas</div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const categoryInfo = CATEGORY_LABELS[task.category]
                const priorityInfo = PRIORITY_LABELS[task.priority]
                const overdue = isOverdue(task.dueDate)
                
                return (
                  <div
                    key={task.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      task.completed
                        ? 'bg-stone-50 border-stone-200 opacity-75'
                        : overdue
                        ? 'bg-red-50 border-red-300'
                        : 'bg-white border-stone-200 hover:border-berry-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleComplete(task)}
                        className="mt-1 w-5 h-5 text-berry-600 rounded focus:ring-berry-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={`font-semibold text-lg mb-1 ${
                              task.completed ? 'line-through text-stone-500' : 'text-berry-950'
                            }`}>
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className={`text-sm mb-2 ${
                                task.completed ? 'text-stone-400' : 'text-berry-600'
                              }`}>
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${categoryInfo.color}`}>
                                {categoryInfo.icon} {categoryInfo.label}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${priorityInfo.color}`}>
                                {priorityInfo.label}
                              </span>
                              {task.dueDate && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  overdue && !task.completed
                                    ? 'bg-red-200 text-red-700'
                                    : 'bg-stone-200 text-stone-700'
                                }`}>
                                  📅 {new Date(task.dueDate).toLocaleDateString('es-CO')}
                                  {overdue && !task.completed && ' ⚠️ Vencida'}
                                </span>
                              )}
                              {task.assignedTo && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  👤 {task.assignedTo}
                                </span>
                              )}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {task.tags.map((tag, idx) => (
                                    <span key={idx} className="px-2 py-1 rounded text-xs bg-stone-100 text-stone-600">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(task)}
                              className="px-3 py-1 bg-berry-600 hover:bg-berry-700 text-white rounded text-xs"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

