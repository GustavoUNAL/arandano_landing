'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  price: number
  description?: string
  category: 'cafe-caliente' | 'cafe-frio' | 'pasteleria' | 'combo' | 'coctel' | 'vino' | 'vodka' | 'ginebra' | 'tequila' | 'whisky'
  type: 'cafeteria' | 'bebida'
  stock: number
  imageUrl?: string
  size?: string
  minStock?: number
  cost?: number
  purchaseDate?: string
  lot?: string
  supplier?: string
  lastSaleDate?: string
  totalSold?: number
}

const CATEGORIES = {
  cafeteria: [
    { value: 'cafe-caliente', label: 'Cafés Calientes' },
    { value: 'cafe-frio', label: 'Cafés Fríos' },
    { value: 'pasteleria', label: 'Pastelería' },
    { value: 'combo', label: 'Combos' }
  ],
  bebida: [
    { value: 'coctel', label: 'Cócteles' },
    { value: 'vino', label: 'Vinos' },
    { value: 'vodka', label: 'Vodka' },
    { value: 'ginebra', label: 'Ginebra' },
    { value: 'tequila', label: 'Tequila' },
    { value: 'whisky', label: 'Whisky' }
  ]
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [pendingTasks, setPendingTasks] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: 'cafe-caliente' as Product['category'],
    type: 'cafeteria' as Product['type'],
    stock: '999',
    imageUrl: '',
    size: '',
    minStock: '',
    cost: '',
    purchaseDate: '',
    lot: '',
    supplier: ''
  })

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/login')
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
      if (data.authenticated) {
        loadProducts()
      }
    } catch (error) {
      setIsAuthenticated(false)
    }
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await response.json()
      if (data.success) {
        setIsAuthenticated(true)
        loadProducts()
        showAlert('success', 'Sesión iniciada correctamente')
      } else {
        setLoginError(data.error || 'Contraseña incorrecta')
      }
    } catch (error) {
      setLoginError('Error al iniciar sesión')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setIsAuthenticated(false)
    setProducts([])
  }

  const loadProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPendingTasks = async () => {
    try {
      const response = await fetch('/api/tasks?completed=false')
      const data = await response.json()
      // Obtener solo las urgentes y de alta prioridad
      const urgentTasks = data.filter((t: any) => 
        t.priority === 'urgente' || t.priority === 'alta'
      ).slice(0, 5)
      setPendingTasks(urgentTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadPendingTasks()
      const interval = setInterval(loadPendingTasks, 60000) // Actualizar cada minuto
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingProduct) {
        // Actualizar producto
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            minStock: formData.minStock ? Number(formData.minStock) : undefined,
            cost: formData.cost ? Number(formData.cost) : undefined,
            purchaseDate: formData.purchaseDate || undefined
          })
        })
        if (response.ok) {
          await loadProducts()
          resetForm()
          showAlert('success', 'Producto actualizado exitosamente')
        } else {
          showAlert('error', 'Error al actualizar el producto')
        }
      } else {
        // Crear producto
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            minStock: formData.minStock ? Number(formData.minStock) : undefined,
            cost: formData.cost ? Number(formData.cost) : undefined,
            purchaseDate: formData.purchaseDate || undefined
          })
        })
        if (response.ok) {
          await loadProducts()
          resetForm()
          showAlert('success', 'Producto creado exitosamente')
        } else {
          showAlert('error', 'Error al crear el producto')
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
      showAlert('error', 'Error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category: product.category,
      type: product.type,
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || '',
      size: product.size || '',
      minStock: product.minStock?.toString() || '',
      cost: product.cost?.toString() || '',
      purchaseDate: product.purchaseDate ? new Date(product.purchaseDate).toISOString().split('T')[0] : '',
      lot: product.lot || '',
      supplier: product.supplier || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await loadProducts()
        showAlert('success', 'Producto eliminado exitosamente')
      } else {
        showAlert('error', 'Error al eliminar el producto')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      showAlert('error', 'Error al eliminar el producto')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      price: '',
      description: '',
      category: 'cafe-caliente',
      type: 'cafeteria',
      stock: '999',
      imageUrl: '',
      size: '',
      minStock: '',
      cost: '',
      purchaseDate: '',
      lot: '',
      supplier: ''
    })
  }

  const handleTypeChange = (type: Product['type']) => {
    setFormData({
      ...formData,
      type,
      category: type === 'cafeteria' ? 'cafe-caliente' : 'coctel'
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
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-berry-950 mb-6 text-center">
            Panel de Administración
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-berry-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                required
              />
            </div>
            {loginError && (
              <div className="text-red-600 text-sm">{loginError}</div>
            )}
            <button
              type="submit"
              className="w-full bg-berry-600 hover:bg-berry-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Iniciar Sesión
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-berry-600 hover:text-berry-800 text-sm"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Alertas */}
        {alert && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 transform transition-all duration-300 ease-in-out ${
            alert.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          } animate-fade-in-up`}>
            <span className="text-xl font-bold">
              {alert.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="font-medium">{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              className="ml-4 text-white hover:text-stone-200 transition-colors"
              aria-label="Cerrar alerta"
            >
              ✕
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-berry-950">
              Panel de Administración
            </h1>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/analytics')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                📊 Analytics
              </button>
              <button
                onClick={() => router.push('/expenses')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                💰 Gastos
              </button>
              <button
                onClick={() => router.push('/tasks')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                ✅ Tareas
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-berry-600 hover:text-berry-800 text-sm font-medium"
              >
                Ver sitio
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Precio (COP) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as Product['type'])}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  required
                >
                  <option value="cafeteria">Cafetería</option>
                  <option value="bebida">Bebida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  required
                >
                  {CATEGORIES[formData.type].map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Tamaño (opcional)
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="Ej: Copa 150ml, Botella 750ml"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  URL de la Imagen
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              {/* Sección de Inventario Inteligente */}
              <div className="md:col-span-2 border-t border-stone-300 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-berry-950 mb-4">📦 Inventario Inteligente</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Stock Mínimo (para alertas)
                </label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  placeholder="Ej: 10"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Costo Unitario (COP)
                </label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="Ej: 2000"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Lote / Número de Lote
                </label>
                <input
                  type="text"
                  value={formData.lot}
                  onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                  placeholder="Ej: LOTE-2024-001"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-berry-700 mb-2">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Ej: Distribuidora XYZ"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Widget de Tareas Pendientes */}
          {pendingTasks.length > 0 && (
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-indigo-800">✅ Tareas Urgentes</h3>
                <button
                  onClick={() => router.push('/tasks')}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Ver todas →
                </button>
              </div>
              <div className="space-y-2">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="text-sm text-indigo-700 flex items-center gap-2">
                    <span className={task.priority === 'urgente' ? 'text-red-600' : 'text-orange-600'}>
                      {task.priority === 'urgente' ? '🔴' : '🟠'}
                    </span>
                    <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
                    {task.dueDate && new Date(task.dueDate) < new Date() && (
                      <span className="text-red-600 text-xs">⚠️ Vencida</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alertas de Inventario */}
          {products.some(p => (p.minStock || 0) > 0 && p.stock <= (p.minStock || 0)) && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ Alertas de Stock Bajo</h3>
              <div className="space-y-2">
                {products
                  .filter(p => (p.minStock || 0) > 0 && p.stock <= (p.minStock || 0))
                  .map(p => (
                    <div key={p.id} className="text-sm text-red-700">
                      <strong>{p.name}</strong>: Stock actual {p.stock}, mínimo {p.minStock}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {products.some(p => {
            const lastSaleDaysAgo = p.lastSaleDate 
              ? Math.floor((Date.now() - new Date(p.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
              : 999
            return lastSaleDaysAgo > 30
          }) && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">😴 Productos Dormidos (30+ días sin venta)</h3>
              <div className="space-y-2">
                {products
                  .filter(p => {
                    const lastSaleDaysAgo = p.lastSaleDate 
                      ? Math.floor((Date.now() - new Date(p.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
                      : 999
                    return lastSaleDaysAgo > 30
                  })
                  .map(p => {
                    const lastSaleDaysAgo = p.lastSaleDate 
                      ? Math.floor((Date.now() - new Date(p.lastSaleDate).getTime()) / (1000 * 60 * 60 * 24))
                      : 999
                    return (
                      <div key={p.id} className="text-sm text-yellow-700">
                        <strong>{p.name}</strong>: {lastSaleDaysAgo === 999 ? 'Nunca vendido' : `${lastSaleDaysAgo} días sin venta`}
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Lista de Productos */}
          <div>
            <h2 className="text-2xl font-bold text-berry-950 mb-4">
              Productos ({products.length})
            </h2>
            {loading && !products.length ? (
              <div className="text-center py-8 text-berry-600">Cargando...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-berry-600">No hay productos</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                  <thead className="bg-berry-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Nombre</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Tipo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Categoría</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Precio</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Stock</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-stone-200 hover:bg-stone-50">
                        <td className="px-4 py-3 text-sm">{product.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.type === 'cafeteria' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {product.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{product.category}</td>
                        <td className="px-4 py-3 text-sm font-semibold">
                          ${product.price.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-sm">{product.stock}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="px-3 py-1 bg-berry-600 hover:bg-berry-700 text-white rounded text-xs transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
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
    </div>
  )
}

