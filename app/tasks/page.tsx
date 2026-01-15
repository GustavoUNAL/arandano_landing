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
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadTasks = async () => {
    setLoading(true)
    try {
      // Cargar todas las tareas sin filtros para el dashboard
      const response = await fetch('/api/tasks')
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
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : []
          })
        })
        if (response.ok) {
          await loadTasks()
          resetForm()
          showAlert('success', 'Tarea actualizada exitosamente')
        } else {
          const errorData = await response.json().catch(() => ({}))
          showAlert('error', errorData.error || 'Error al actualizar tarea')
        }
      } else {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : []
          })
        })
        if (response.ok) {
          await loadTasks()
          resetForm()
          showAlert('success', 'Tarea creada exitosamente')
        } else {
          const errorData = await response.json().catch(() => ({}))
          showAlert('error', errorData.error || 'Error al crear tarea')
        }
      }
    } catch (error) {
      showAlert('error', 'Error al guardar tarea')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (task: Task) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      })
      if (response.ok) {
        await loadTasks()
        showAlert('success', task.completed ? 'Tarea marcada como pendiente' : 'Tarea marcada como completada')
      } else {
        showAlert('error', 'Error al actualizar tarea')
      }
    } catch (error) {
      showAlert('error', 'Error al actualizar tarea')
    } finally {
      setLoading(false)
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
    setShowAddTaskModal(false)
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
    setShowAddTaskModal(true)
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedTo: task.assignedTo || '',
      tags: task.tags?.join(', ') || ''
    })
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

  // Filtrar tareas por búsqueda y filtros
  const filteredTasks = tasks.filter(task => {
    // Filtro de búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesSearch = (
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.assignedTo?.toLowerCase().includes(search) ||
        task.tags?.some(tag => tag.toLowerCase().includes(search))
      )
      if (!matchesSearch) return false
    }
    
    // Filtro de categoría
    if (filter.category !== 'all' && task.category !== filter.category) return false
    
    // Filtro de prioridad
    if (filter.priority !== 'all' && task.priority !== filter.priority) return false
    
    // Filtro de estado
    if (filter.completed === 'pending' && task.completed) return false
    if (filter.completed === 'completed' && !task.completed) return false
    
    return true
  })

  // Estadísticas del dashboard (todas las tareas, sin filtros)
  const pendingTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate) && !t.completed)

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

        {/* Header con título centrado, búsqueda y configuración abajo */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/admin"
              className="px-2 py-1.5 text-berry-600 hover:text-berry-800 text-base font-medium transition-colors"
            >
              ←
            </Link>
            <h1 className="flex-1 text-center text-xl sm:text-2xl font-bold text-berry-950">Lista de Tareas</h1>
            <div className="w-8"></div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-1 focus:ring-berry-500 focus:border-berry-500 transition-all bg-transparent"
            />
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 text-berry-600 hover:text-berry-700 hover:bg-berry-50 rounded-lg transition-all flex items-center justify-center"
              title="Configuraciones"
            >
              <span className="text-xl">⚙️</span>
            </button>
          </div>
        </div>

        {/* Resumen - 2 columnas con 2 filas */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 border border-stone-200">
            <div className="text-xs text-berry-600 mb-1 font-medium">Pendientes</div>
            <div className="text-2xl font-bold text-berry-950">{pendingTasks.length}</div>
          </div>
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
            <div className="text-xs text-red-600 mb-1 font-medium">Vencidas</div>
            <div className="text-2xl font-bold text-red-700">{overdueTasks.length}</div>
          </div>
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
            <div className="text-xs text-green-600 mb-1 font-medium">Completadas</div>
            <div className="text-2xl font-bold text-green-700">{completedTasks.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 border border-stone-200">
            <div className="text-xs text-berry-600 mb-1 font-medium">Total</div>
            <div className="text-2xl font-bold text-berry-950">{tasks.length}</div>
          </div>
        </div>



        {/* Lista de Tareas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-berry-950 mb-4">
            Tareas {filter.completed === 'pending' ? 'Pendientes' : filter.completed === 'completed' ? 'Completadas' : ''}
          </h2>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-berry-600">
              {searchTerm ? 'No se encontraron tareas con ese término de búsqueda' : 'No hay tareas'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const categoryInfo = CATEGORY_LABELS[task.category]
                const priorityInfo = PRIORITY_LABELS[task.priority]
                const overdue = isOverdue(task.dueDate)
                
                return (
                  <div
                    key={task.id}
                    className={`rounded-xl p-4 transition-all ${
                      task.completed
                        ? 'bg-stone-50/50 border border-stone-200'
                        : overdue
                        ? 'bg-red-50/80 border-2 border-red-300 shadow-sm'
                        : 'bg-white border border-stone-200 hover:shadow-lg hover:border-berry-300'
                    }`}
                  >
                    {/* Header con botones de acción y título */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Botón de marcar como completado */}
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white shadow-sm'
                            : 'border-stone-300 bg-white hover:border-green-400 hover:bg-green-50'
                        }`}
                        title={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                        aria-label={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                      >
                        {task.completed && <span className="text-sm font-bold">✓</span>}
                      </button>
                      
                      {/* Contenido principal */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-base mb-1.5 ${
                          task.completed ? 'line-through text-stone-500' : 'text-berry-950'
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className={`text-sm mb-2.5 line-clamp-2 ${
                            task.completed ? 'text-stone-400' : 'text-stone-600'
                          }`}>
                            {task.description}
                          </p>
                        )}
                        {/* Badges y metadata */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${categoryInfo.color}`}>
                            {categoryInfo.icon} {categoryInfo.label}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                          {task.dueDate && (
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                              overdue && !task.completed
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}>
                              {new Date(task.dueDate).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                              {overdue && !task.completed && ' ⚠️'}
                            </span>
                          )}
                          {task.assignedTo && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {task.assignedTo}
                            </span>
                          )}
                          {task.tags && task.tags.length > 0 && (
                            <>
                              {task.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                                  #{tag}
                                </span>
                              ))}
                              {task.tags.length > 2 && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
                                  +{task.tags.length - 2}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Botones de acción a la derecha */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-2.5 text-berry-600 hover:text-berry-700 hover:bg-berry-50 rounded-lg transition-colors"
                          title="Editar tarea"
                          aria-label="Editar"
                        >
                          <span className="text-lg">✏️</span>
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar tarea"
                          aria-label="Eliminar"
                        >
                          <span className="text-lg">🗑️</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal de Configuraciones */}
        {showConfigModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfigModal(false)}
          >
            <div 
              className="bg-white rounded-2xl p-4 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-berry-950">Configuraciones</h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-stone-500 hover:text-stone-700 text-xl leading-none w-7 h-7 flex items-center justify-center"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2.5">
              {/* Agregar Nueva Tarea */}
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  resetForm()
                  setShowAddTaskModal(true)
                }}
                className="w-full px-3 py-2.5 rounded-lg font-semibold transition-all text-left bg-berry-600 text-white shadow-md hover:bg-berry-700 active:bg-berry-800 text-sm"
              >
                Nueva Tarea
              </button>

                {/* Filtros */}
                <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200">
                  <div className="text-xs font-semibold text-stone-700 mb-2">Filtros</div>
                  <div className="space-y-2">
                    {/* Filtro Categoría */}
                    <div>
                      <label className="block text-xs text-stone-600 mb-1">Categoría</label>
                      <select
                        value={filter.category}
                        onChange={(e) => setFilter({ ...filter, category: e.target.value as TaskCategory | 'all' })}
                        className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-1 focus:ring-berry-500 focus:border-berry-500 bg-white"
                      >
                        <option value="all">Todas</option>
                        {Object.entries(CATEGORY_LABELS).map(([value, { label }]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro Prioridad */}
                    <div>
                      <label className="block text-xs text-stone-600 mb-1">Prioridad</label>
                      <select
                        value={filter.priority}
                        onChange={(e) => setFilter({ ...filter, priority: e.target.value as TaskPriority | 'all' })}
                        className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-1 focus:ring-berry-500 focus:border-berry-500 bg-white"
                      >
                        <option value="all">Todas</option>
                        {Object.entries(PRIORITY_LABELS).map(([value, { label }]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro Estado */}
                    <div>
                      <label className="block text-xs text-stone-600 mb-1">Estado</label>
                      <select
                        value={filter.completed}
                        onChange={(e) => setFilter({ ...filter, completed: e.target.value as 'all' | 'pending' | 'completed' })}
                        className="w-full px-2 py-1.5 text-xs border border-stone-300 rounded-md focus:ring-1 focus:ring-berry-500 focus:border-berry-500 bg-white"
                      >
                        <option value="pending">Pendientes</option>
                        <option value="completed">Completadas</option>
                        <option value="all">Todas</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Limpiar Filtros */}
                {(filter.category !== 'all' || filter.priority !== 'all' || filter.completed !== 'pending' || searchTerm) && (
                  <button
                    onClick={() => {
                      setFilter({ category: 'all', priority: 'all', completed: 'pending' })
                      setSearchTerm('')
                      setShowConfigModal(false)
                      showAlert('success', 'Filtros limpiados')
                    }}
                    className="w-full px-3 py-2 rounded-md font-medium transition-all text-xs text-center bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300 border border-red-300"
                  >
                    Limpiar Filtros
                  </button>
                )}

                {/* Estadísticas */}
                <div className="pt-2 border-t border-stone-200">
                  <div className="text-xs font-semibold text-stone-700 mb-1.5">Estadísticas</div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs bg-stone-50 rounded-md p-2">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Pendientes:</span>
                      <span className="font-semibold text-berry-700">{pendingTasks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Completadas:</span>
                      <span className="font-semibold text-green-700">{completedTasks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Vencidas:</span>
                      <span className="font-semibold text-red-700">{overdueTasks.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Total:</span>
                      <span className="font-semibold text-berry-700">{filteredTasks.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-full px-3 py-2.5 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-semibold rounded-lg transition-colors mt-3 text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Botón Flotante para Nueva Tarea */}
        <button
          onClick={() => {
            resetForm()
            setShowAddTaskModal(true)
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-berry-600 hover:bg-berry-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center z-40"
          title="Nueva Tarea"
          aria-label="Crear nueva tarea"
        >
          <span className="text-2xl font-bold">+</span>
        </button>

        {/* Modal de Nueva/Editar Tarea */}
        {(showAddTaskModal || editingTask) && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              if (!loading) {
                resetForm()
              }
            }}
          >
            <div 
              className="bg-white rounded-2xl p-4 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-berry-950">
                  {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
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

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-berry-700 mb-1.5">Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-berry-700 mb-1.5">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                    placeholder="Descripción breve..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-berry-700 mb-1.5">Categoría *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                      className="w-full px-2 py-2 text-xs border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                      required
                    >
                      {Object.entries(CATEGORY_LABELS).map(([value, { label }]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-berry-700 mb-1.5">Prioridad *</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                      className="w-full px-2 py-2 text-xs border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                      required
                    >
                      {Object.entries(PRIORITY_LABELS).map(([value, { label }]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-berry-700 mb-1.5">Fecha Vencimiento</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-2 py-2 text-xs border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-berry-700 mb-1.5">Asignado a</label>
                    <input
                      type="text"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      placeholder="Nombre"
                      className="w-full px-2 py-2 text-xs border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-berry-700 mb-1.5">Tags (separados por comas)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="tag1, tag2"
                    className="w-full px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="flex-1 px-3 py-2.5 text-sm border-2 border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.title}
                    className="flex-1 px-3 py-2.5 text-sm bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {loading ? 'Guardando...' : editingTask ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Botón flotante para volver al panel */}
        <button
          onClick={() => router.push('/admin')}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-berry-600 hover:bg-berry-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center z-40"
          title="Volver al Panel de Administración"
          aria-label="Volver al Panel de Administración"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

