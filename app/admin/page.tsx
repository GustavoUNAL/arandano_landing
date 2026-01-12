'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  price: number
  description?: string
  category: 'cafe-caliente' | 'cafe-frio' | 'pasteleria' | 'combo' | 'coctel' | 'cerveza' | 'vino' | 'vodka' | 'ginebra' | 'tequila' | 'whisky'
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
    { value: 'cerveza', label: 'Cervezas' },
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
  const [activeTab, setActiveTab] = useState<'products' | 'inventory'>('products')
  const [currentView, setCurrentView] = useState<'dashboard' | 'products' | 'products-for-sale'>('dashboard')
  const [sales, setSales] = useState<any[]>([])
  const [editingStock, setEditingStock] = useState<{ id: string; stock: number } | null>(null)
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null)
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
        loadSales()
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
        loadSales()
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

  const loadSales = async () => {
    try {
      const response = await fetch('/api/sales')
      const data = await response.json()
      setSales(data)
    } catch (error) {
      console.error('Error loading sales:', error)
    }
  }

  const updateProductStock = async (productId: string, newStock: number) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      })
      if (response.ok) {
        await loadProducts()
        showAlert('success', 'Stock actualizado exitosamente')
      } else {
        showAlert('error', 'Error al actualizar el stock')
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      showAlert('error', 'Error al actualizar el stock')
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

        {/* Título principal centrado */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-berry-950 text-center mb-4">
            Panel de Administración
          </h1>
          
          {/* Botones de acción centrados */}
          <div className="flex flex-wrap justify-center items-center gap-3">
            {currentView !== 'dashboard' && (
              <a
                href="/admin"
                className="px-4 py-2 text-berry-600 hover:text-berry-800 text-sm font-medium"
              >
                ← Volver a Admin
              </a>
            )}
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-berry-600 hover:text-berry-800 text-sm font-medium border border-berry-300 rounded-lg transition-colors"
            >
              Ver sitio
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Dashboard con tarjetas */}
        {currentView === 'dashboard' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Tarjeta Productos a la venta */}
            <button
              onClick={() => {
                setCurrentView('products-for-sale')
                loadSales()
              }}
              className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all transform active:scale-95 sm:hover:scale-105 text-left"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-berry-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">☕</span>
                </div>
                <h2 className="text-sm sm:text-base lg:text-xl font-bold text-berry-950 text-center sm:text-left">Productos a la venta</h2>
              </div>
              <p className="text-stone-600 text-xs sm:text-sm leading-tight">
                Calcula rentabilidad y gestiona stock
              </p>
            </button>

            {/* Tarjeta Inventario */}
            <button
              onClick={() => router.push('/inventory')}
              className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all transform active:scale-95 sm:hover:scale-105 text-left"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📦</span>
                </div>
                <h2 className="text-sm sm:text-base lg:text-xl font-bold text-berry-950 text-center sm:text-left">Inventario</h2>
              </div>
              <p className="text-stone-600 text-xs sm:text-sm leading-tight">
                Control de insumos, stock y proveedores
              </p>
            </button>

            {/* Tarjeta Tareas */}
            <button
              onClick={() => router.push('/tasks')}
              className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all transform active:scale-95 sm:hover:scale-105 text-left"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">✅</span>
                </div>
                <h2 className="text-sm sm:text-base lg:text-xl font-bold text-berry-950 text-center sm:text-left">Tareas</h2>
              </div>
              <p className="text-stone-600 text-xs sm:text-sm leading-tight">
                Organiza y gestiona tareas pendientes
              </p>
            </button>

            {/* Tarjeta Gastos */}
            <button
              onClick={() => router.push('/expenses')}
              className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all transform active:scale-95 sm:hover:scale-105 text-left"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">💰</span>
                </div>
                <h2 className="text-sm sm:text-base lg:text-xl font-bold text-berry-950 text-center sm:text-left">Gastos</h2>
              </div>
              <p className="text-stone-600 text-xs sm:text-sm leading-tight">
                Registra y controla gastos fijos y variables
              </p>
            </button>

            {/* Tarjeta Analytics */}
            <button
              onClick={() => router.push('/analytics')}
              className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all transform active:scale-95 sm:hover:scale-105 text-left"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📊</span>
                </div>
                <h2 className="text-sm sm:text-base lg:text-xl font-bold text-berry-950 text-center sm:text-left">Analytics</h2>
              </div>
              <p className="text-stone-600 text-xs sm:text-sm leading-tight">
                Métricas, KPIs y análisis de ventas
              </p>
            </button>

            {/* Tarjeta Sistema de Cobros */}
            <button
              onClick={() => router.push('/waiter')}
              className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all transform active:scale-95 sm:hover:scale-105 text-left"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3 lg:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">💳</span>
                </div>
                <h2 className="text-sm sm:text-base lg:text-xl font-bold text-berry-950 text-center sm:text-left">Cobros</h2>
              </div>
              <p className="text-stone-600 text-xs sm:text-sm leading-tight">
                Registro de ventas y procesamiento de pagos
              </p>
            </button>
          </div>
        )}

        {/* Vista de Productos */}
        {currentView === 'products' && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">


          {/* Tabs para móvil */}
          <div className="flex sm:hidden gap-2 mb-4 border-b border-stone-200">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-berry-600 text-berry-600'
                  : 'border-transparent text-stone-500'
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'inventory'
                  ? 'border-berry-600 text-berry-600'
                  : 'border-transparent text-stone-500'
              }`}
            >
              Inventario
            </button>
          </div>

          {/* Formulario - Oculto en móvil cuando está en tab de inventario */}
          <div className={`${activeTab === 'inventory' ? 'hidden sm:block' : ''}`}>
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 sm:mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Precio (COP) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as Product['type'])}
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  required
                >
                  <option value="cafeteria">Cafetería</option>
                  <option value="bebida">Bebida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
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
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Tamaño (opcional)
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="Ej: Copa 150ml, Botella 750ml"
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  URL de la Imagen
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              {/* Sección de Inventario Inteligente */}
              <div className="md:col-span-2 border-t border-stone-300 pt-4 mt-4">
                <h3 className="text-base sm:text-lg font-semibold text-berry-950 mb-4">📦 Inventario Inteligente</h3>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Stock Mínimo (para alertas)
                </label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  placeholder="Ej: 10"
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Costo Unitario (COP)
                </label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="Ej: 2000"
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Lote / Número de Lote
                </label>
                <input
                  type="text"
                  value={formData.lot}
                  onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                  placeholder="Ej: LOTE-2024-001"
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-berry-700 mb-2">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Ej: Distribuidora XYZ"
                  className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>
            </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 sm:py-2 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-base sm:text-sm"
                >
                  {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 sm:flex-none px-6 py-3 sm:py-2 bg-stone-300 hover:bg-stone-400 text-stone-800 font-semibold rounded-lg transition-colors text-base sm:text-sm"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

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

          {/* Vista de Inventario (Móvil) */}
          {activeTab === 'inventory' && (
            <div className="sm:hidden space-y-4 mb-6">
              <h2 className="text-xl font-bold text-berry-950 mb-4">📦 Inventario Rápido</h2>
              <div className="space-y-3">
                {products
                  .filter(p => p.stock !== undefined)
                  .sort((a, b) => {
                    // Ordenar: stock bajo primero, luego por nombre
                    const aLow = (a.minStock || 0) > 0 && a.stock <= (a.minStock || 0);
                    const bLow = (b.minStock || 0) > 0 && b.stock <= (b.minStock || 0);
                    if (aLow !== bLow) return aLow ? -1 : 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((product) => {
                    const isLowStock = (product.minStock || 0) > 0 && product.stock <= (product.minStock || 0);
                    return (
                      <div
                        key={product.id}
                        className={`bg-white border-2 rounded-lg p-4 ${
                          isLowStock ? 'border-red-300 bg-red-50' : 'border-stone-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base text-berry-950 mb-1">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                product.type === 'cafeteria' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {product.type}
                              </span>
                              <span className="text-xs text-stone-500">{product.category}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-stone-600">Stock: <span className={`font-bold ${isLowStock ? 'text-red-600' : 'text-berry-700'}`}>{product.stock}</span></div>
                                {product.minStock && (
                                  <div className="text-xs text-stone-500">Mín: {product.minStock}</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-berry-700">
                                  ${product.price.toLocaleString('es-CO')}
                                </div>
                                {product.cost && (
                                  <div className="text-xs text-stone-500">
                                    Costo: ${product.cost.toLocaleString('es-CO')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleEdit(product)}
                            className="flex-1 px-3 py-2 bg-berry-600 hover:bg-berry-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Lista de Productos */}
          <div className={activeTab === 'inventory' ? 'hidden sm:block' : ''}>
            <h2 className="text-xl sm:text-2xl font-bold text-berry-950 mb-4">
              Productos ({products.length})
            </h2>
            {loading && !products.length ? (
              <div className="text-center py-8 text-berry-600">Cargando...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-berry-600">No hay productos</div>
            ) : (
              <>
                {/* Vista Cards (Móvil) */}
                <div className="sm:hidden space-y-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border-2 border-stone-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base text-berry-950 mb-1">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              product.type === 'cafeteria' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {product.type}
                            </span>
                            <span className="text-xs text-stone-500">{product.category}</span>
                          </div>
                          <div className="text-sm font-semibold text-berry-700 mb-1">
                            ${product.price.toLocaleString('es-CO')}
                          </div>
                          <div className="text-sm text-stone-600">
                            Stock: <span className="font-semibold">{product.stock}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex-1 px-3 py-2 bg-berry-600 hover:bg-berry-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vista Tabla (Desktop) */}
                <div className="hidden sm:block overflow-x-auto">
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
              </>
            )}
          </div>
        </div>
        )}

        {/* Vista de Productos a la venta con rentabilidad */}
        {currentView === 'products-for-sale' && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-berry-950 mb-4 sm:mb-6">
              Productos a la venta - Rentabilidad
            </h2>

            {loading ? (
              <div className="text-center py-8 text-berry-600">Cargando...</div>
            ) : (
              <>
                {/* Vista Cards para móvil */}
                <div className="sm:hidden space-y-3">
                  {products.map((product) => {
                    const productSales = sales.filter(sale =>
                      sale.items?.some((item: any) => item.productId === product.id)
                    )
                    const totalSold = productSales.reduce((sum, sale) => {
                      const item = sale.items?.find((i: any) => i.productId === product.id)
                      return sum + (item?.quantity || 0)
                    }, 0)

                    const cost = product.cost || 0
                    const price = product.price
                    const margin = price - cost
                    const marginPercent = price > 0 ? ((margin / price) * 100) : 0
                    const totalProfit = totalSold * margin

                    return (
                      <div
                        key={product.id}
                        className="border border-stone-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-berry-950 text-base mb-1">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-stone-600">
                                Precio: <span className="font-semibold text-berry-600">${price.toLocaleString('es-CO')}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          <div className="bg-stone-50 rounded p-2">
                            <div className="text-xs text-stone-600">Vendidos</div>
                            <div className="font-semibold text-berry-950">{totalSold}</div>
                          </div>
                          <div className="bg-stone-50 rounded p-2">
                            <div className="text-xs text-stone-600">Stock</div>
                            <div className="font-semibold text-berry-950">{product.stock}</div>
                          </div>
                        </div>

                        {cost > 0 && (
                          <div className="mb-3 p-2 bg-berry-50 rounded">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-stone-600">Margen:</span>
                              <span className={`font-semibold ${
                                marginPercent >= 50 ? 'text-green-600' :
                                marginPercent >= 30 ? 'text-blue-600' :
                                marginPercent >= 10 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {marginPercent.toFixed(1)}%
                              </span>
                            </div>
                            {totalProfit > 0 && (
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-stone-600">Rentabilidad:</span>
                                <span className="font-semibold text-green-600">
                                  ${totalProfit.toLocaleString('es-CO')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedProductDetail(product)}
                            className="flex-1 px-3 py-2 bg-berry-600 hover:bg-berry-700 text-white rounded-lg text-sm font-medium"
                          >
                            Ver Detalles
                          </button>
                          <button
                            onClick={() => {
                              const today = new Date().toISOString().split('T')[0]
                              const todaySales = productSales.filter(sale => sale.date?.startsWith(today))
                              const soldToday = todaySales.reduce((sum, sale) => {
                                const item = sale.items?.find((i: any) => i.productId === product.id)
                                return sum + (item?.quantity || 0)
                              }, 0)
                              const newStock = Math.max(0, product.stock - soldToday)
                              updateProductStock(product.id, newStock)
                            }}
                            className="px-3 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded-lg text-sm font-medium"
                          >
                            Ajustar
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Vista Tabla para desktop */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-berry-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-berry-950">Producto</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-berry-950">Precio</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-berry-950">Costo</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-berry-950">Margen</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-berry-950">Margen %</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-berry-950">Vendidos</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-berry-950">Stock</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-berry-950">Rentabilidad</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-berry-950">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => {
                        const productSales = sales.filter(sale =>
                          sale.items?.some((item: any) => item.productId === product.id)
                        )
                        const totalSold = productSales.reduce((sum, sale) => {
                          const item = sale.items?.find((i: any) => i.productId === product.id)
                          return sum + (item?.quantity || 0)
                        }, 0)

                        const cost = product.cost || 0
                        const price = product.price
                        const margin = price - cost
                        const marginPercent = price > 0 ? ((margin / price) * 100) : 0
                        const totalProfit = totalSold * margin

                        return (
                          <tr key={product.id} className="border-b border-stone-200 hover:bg-stone-50">
                            <td className="px-4 py-3 text-sm font-medium text-berry-950">
                              {product.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              ${price.toLocaleString('es-CO')}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {cost > 0 ? `$${cost.toLocaleString('es-CO')}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {cost > 0 ? `$${margin.toLocaleString('es-CO')}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {cost > 0 ? (
                                <span className={`font-semibold ${
                                  marginPercent >= 50 ? 'text-green-600' :
                                  marginPercent >= 30 ? 'text-blue-600' :
                                  marginPercent >= 10 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {marginPercent.toFixed(1)}%
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-medium">
                              {totalSold}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {editingStock?.id === product.id ? (
                                <input
                                  type="number"
                                  value={editingStock.stock}
                                  onChange={(e) => setEditingStock({ id: product.id, stock: parseInt(e.target.value) || 0 })}
                                  className="w-20 px-2 py-1 border border-berry-300 rounded text-center text-xs"
                                  autoFocus
                                  onBlur={() => {
                                    if (editingStock) {
                                      updateProductStock(editingStock.id, editingStock.stock)
                                      setEditingStock(null)
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && editingStock) {
                                      updateProductStock(editingStock.id, editingStock.stock)
                                      setEditingStock(null)
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingStock(null)
                                    }
                                  }}
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingStock({ id: product.id, stock: product.stock })}
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    product.stock <= (product.minStock || 0)
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                  }`}
                                >
                                  {product.stock}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {cost > 0 && totalSold > 0 ? (
                                <span className={`font-semibold ${
                                  totalProfit > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ${totalProfit.toLocaleString('es-CO')}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <button
                                onClick={() => {
                                  const today = new Date().toISOString().split('T')[0]
                                  const todaySales = productSales.filter(sale => sale.date?.startsWith(today))
                                  const soldToday = todaySales.reduce((sum, sale) => {
                                    const item = sale.items?.find((i: any) => i.productId === product.id)
                                    return sum + (item?.quantity || 0)
                                  }, 0)
                                  const newStock = Math.max(0, product.stock - soldToday)
                                  updateProductStock(product.id, newStock)
                                }}
                                className="px-2 py-1 bg-berry-600 hover:bg-berry-700 text-white rounded text-xs font-medium transition-colors"
                                title="Ajustar stock restando ventas del día"
                              >
                                Ajustar
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-berry-50 rounded-lg">
              <p className="text-xs sm:text-sm text-berry-700">
                <strong>Nota:</strong> El stock se puede ajustar manualmente haciendo clic en el número. 
                El botón &quot;Ajustar&quot; resta automáticamente las ventas del día actual del stock.
              </p>
            </div>
          </div>
        )}

        {/* Modal de detalle del producto */}
        {selectedProductDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full my-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-berry-950">Detalle del Producto</h3>
                <button
                  onClick={() => setSelectedProductDetail(null)}
                  className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-xl font-bold"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              {(() => {
                const product = selectedProductDetail
                const productSales = sales.filter(sale =>
                  sale.items?.some((item: any) => item.productId === product.id)
                )
                const totalSold = productSales.reduce((sum, sale) => {
                  const item = sale.items?.find((i: any) => i.productId === product.id)
                  return sum + (item?.quantity || 0)
                }, 0)

                const cost = product.cost || 0
                const price = product.price
                const margin = price - cost
                const marginPercent = price > 0 ? ((margin / price) * 100) : 0
                const totalProfit = totalSold * margin

                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-berry-950 text-lg mb-2">{product.name}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.type === 'cafeteria' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {product.type}
                        </span>
                        <span className="text-xs text-stone-500">{product.category}</span>
                      </div>
                    </div>

                    <div className="bg-stone-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="block text-xs text-stone-600 mb-1">Precio de venta:</span>
                          <span className="font-semibold text-berry-600 text-base">
                            ${price.toLocaleString('es-CO')}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs text-stone-600 mb-1">Costo:</span>
                          <span className="font-semibold text-stone-700 text-base">
                            {cost > 0 ? `$${cost.toLocaleString('es-CO')}` : 'No definido'}
                          </span>
                        </div>
                        {cost > 0 && (
                          <>
                            <div>
                              <span className="block text-xs text-stone-600 mb-1">Margen:</span>
                              <span className="font-semibold text-berry-600 text-base">
                                ${margin.toLocaleString('es-CO')}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs text-stone-600 mb-1">Margen %:</span>
                              <span className={`font-semibold text-base ${
                                marginPercent >= 50 ? 'text-green-600' :
                                marginPercent >= 30 ? 'text-blue-600' :
                                marginPercent >= 10 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {marginPercent.toFixed(1)}%
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-berry-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="block text-xs text-stone-600 mb-1">Total vendido:</span>
                          <span className="font-semibold text-berry-950 text-base">{totalSold} unidades</span>
                        </div>
                        <div>
                          <span className="block text-xs text-stone-600 mb-1">Stock actual:</span>
                          <span className={`font-semibold text-base ${
                            product.stock <= (product.minStock || 0) ? 'text-red-600' : 'text-berry-600'
                          }`}>
                            {product.stock} unidades
                          </span>
                        </div>
                        {cost > 0 && totalSold > 0 && (
                          <div className="col-span-2">
                            <span className="block text-xs text-stone-600 mb-1">Rentabilidad total:</span>
                            <span className={`font-semibold text-lg ${
                              totalProfit > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${totalProfit.toLocaleString('es-CO')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
                      <button
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0]
                          const todaySales = productSales.filter(sale => sale.date?.startsWith(today))
                          const soldToday = todaySales.reduce((sum, sale) => {
                            const item = sale.items?.find((i: any) => i.productId === product.id)
                            return sum + (item?.quantity || 0)
                          }, 0)
                          const newStock = Math.max(0, product.stock - soldToday)
                          updateProductStock(product.id, newStock)
                          setSelectedProductDetail(null)
                        }}
                        className="flex-1 px-4 py-2 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Ajustar Stock
                      </button>
                      <button
                        onClick={() => setSelectedProductDetail(null)}
                        className="flex-1 px-4 py-2 border-2 border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

