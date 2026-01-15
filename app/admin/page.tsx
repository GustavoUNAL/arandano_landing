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
  const [editingProductForSale, setEditingProductForSale] = useState<Product | null>(null)
  const [productEditForm, setProductEditForm] = useState({
    name: '',
    price: '',
    description: '',
    category: 'cafe-caliente' as Product['category'],
    type: 'cafeteria' as Product['type'],
    stock: '',
    imageUrl: '',
    size: '',
    cost: '',
    minStock: ''
  })

  const handleEditProductForSale = (product: Product) => {
    setEditingProductForSale(product)
    setProductEditForm({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category: product.category,
      type: product.type,
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || '',
      size: product.size || '',
      cost: product.cost?.toString() || '',
      minStock: product.minStock?.toString() || ''
    })
  }

  const handleSaveProductForSale = async () => {
    if (!editingProductForSale) return

    setLoading(true)
    try {
      const response = await fetch(`/api/products/${editingProductForSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productEditForm.name,
          price: Number(productEditForm.price),
          description: productEditForm.description || undefined,
          category: productEditForm.category,
          type: productEditForm.type,
          stock: Number(productEditForm.stock),
          imageUrl: productEditForm.imageUrl || undefined,
          size: productEditForm.size || undefined,
          cost: productEditForm.cost ? Number(productEditForm.cost) : undefined,
          minStock: productEditForm.minStock ? Number(productEditForm.minStock) : undefined
        })
      })

      if (response.ok) {
        await loadProducts()
        setEditingProductForSale(null)
        setSelectedProductDetail(null)
        showAlert('success', 'Producto actualizado exitosamente')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        showAlert('error', errorData.error || 'Error al actualizar el producto')
      }
    } catch (error: any) {
      console.error('Error saving product:', error)
      showAlert('error', error?.message || 'Error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      })
      
      if (response.ok) {
        await loadProducts()
        showAlert('success', 'Stock actualizado exitosamente')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('Error response:', response.status, errorData)
        showAlert('error', errorData.error || `Error al actualizar el stock (${response.status})`)
      }
    } catch (error: any) {
      console.error('Error updating stock:', error)
      showAlert('error', error?.message || 'Error al actualizar el stock')
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

        {/* Botones de acción en esquinas superiores - Ocultos en products-for-sale */}
        {currentView !== 'products-for-sale' && (
          <div className="relative mb-4 sm:mb-6">
            <div className="flex justify-between items-start mb-4">
              {/* Botón Ver sitio - Esquina superior izquierda */}
              <button
                onClick={() => router.push('/')}
                className="group flex items-center gap-2 px-3 py-2 text-berry-600 hover:text-berry-700 font-medium rounded-lg hover:bg-berry-50 transition-all duration-200 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Ver sitio</span>
              </button>

              {/* Botón Salir - Esquina superior derecha */}
              <button
                onClick={handleLogout}
                className="group flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 font-medium rounded-lg hover:bg-red-50 transition-all duration-200 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Salir</span>
              </button>
            </div>

            {/* Título principal centrado - Solo en dashboard */}
            {currentView === 'dashboard' && (
              <h1 className="text-2xl sm:text-3xl font-bold text-berry-950 text-center">
                Panel de Administración
              </h1>
            )}

            {/* Botón Volver a Admin - Solo cuando está en products */}
            {currentView === 'products' && (
              <div className="flex justify-center mt-3">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-4 py-2 text-berry-600 hover:text-berry-800 text-sm font-medium"
                >
                  ← Volver a Admin
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dashboard con tarjetas */}
        {currentView === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Tarjeta Productos a la venta */}
            <button
              onClick={() => {
                setCurrentView('products-for-sale')
                loadSales()
              }}
              className="group bg-white rounded-xl border-2 border-stone-200 hover:border-berry-300 p-4 sm:p-5 hover:shadow-lg transition-all duration-200 flex flex-col h-full items-center text-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-berry-100 rounded-xl flex items-center justify-center flex-shrink-0 mb-3 group-hover:bg-berry-200 transition-colors">
                <span className="text-2xl sm:text-3xl">☕</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-berry-950 mb-1.5 leading-tight">Productos a la venta</h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed flex-grow">
                Calcula rentabilidad y gestiona stock
              </p>
            </button>

            {/* Tarjeta Inventario */}
            <button
              onClick={() => router.push('/inventory')}
              className="group bg-white rounded-xl border-2 border-stone-200 hover:border-emerald-300 p-4 sm:p-5 hover:shadow-lg transition-all duration-200 flex flex-col h-full items-center text-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 mb-3 group-hover:bg-emerald-200 transition-colors">
                <span className="text-2xl sm:text-3xl">📦</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-berry-950 mb-1.5 leading-tight">Inventario</h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed flex-grow">
                Control de insumos, stock y proveedores
              </p>
            </button>

            {/* Tarjeta Tareas */}
            <button
              onClick={() => router.push('/tasks')}
              className="group bg-white rounded-xl border-2 border-stone-200 hover:border-indigo-300 p-4 sm:p-5 hover:shadow-lg transition-all duration-200 flex flex-col h-full items-center text-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mb-3 group-hover:bg-indigo-200 transition-colors">
                <span className="text-2xl sm:text-3xl">✅</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-berry-950 mb-1.5 leading-tight">Tareas</h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed flex-grow">
                Organiza y gestiona tareas pendientes
              </p>
            </button>

            {/* Tarjeta Gastos */}
            <button
              onClick={() => router.push('/expenses')}
              className="group bg-white rounded-xl border-2 border-stone-200 hover:border-purple-300 p-4 sm:p-5 hover:shadow-lg transition-all duration-200 flex flex-col h-full items-center text-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 mb-3 group-hover:bg-purple-200 transition-colors">
                <span className="text-2xl sm:text-3xl">💰</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-berry-950 mb-1.5 leading-tight">Gastos</h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed flex-grow">
                Registra y controla gastos fijos y variables
              </p>
            </button>

            {/* Tarjeta Analytics */}
            <button
              onClick={() => router.push('/analytics')}
              className="group bg-white rounded-xl border-2 border-stone-200 hover:border-blue-300 p-4 sm:p-5 hover:shadow-lg transition-all duration-200 flex flex-col h-full items-center text-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mb-3 group-hover:bg-blue-200 transition-colors">
                <span className="text-2xl sm:text-3xl">📊</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-berry-950 mb-1.5 leading-tight">Analytics</h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed flex-grow">
                Métricas, KPIs y análisis de ventas
              </p>
            </button>

            {/* Tarjeta Sistema de Cobros */}
            <button
              onClick={() => router.push('/waiter')}
              className="group bg-white rounded-xl border-2 border-stone-200 hover:border-amber-300 p-4 sm:p-5 hover:shadow-lg transition-all duration-200 flex flex-col h-full items-center text-center"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mb-3 group-hover:bg-amber-200 transition-colors">
                <span className="text-2xl sm:text-3xl">💳</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-berry-950 mb-1.5 leading-tight">Cobros</h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed flex-grow">
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
          <>
            {/* Título fuera de la tarjeta */}
            <h2 className="text-xl sm:text-2xl font-bold text-berry-950 mb-4 sm:mb-6 text-center">
              Productos a la venta - Rentabilidad
            </h2>

            {loading ? (
              <div className="text-center py-8 text-berry-600">Cargando...</div>
            ) : (
              <>
                {/* Vista Cards para móvil */}
                <div className="sm:hidden grid grid-cols-1 gap-4">
                  {products
                    .map((product) => {
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

                      return { product, totalSold, cost, price, margin, marginPercent, totalProfit }
                    })
                    .sort((a, b) => b.totalProfit - a.totalProfit)
                    .map(({ product, totalSold, cost, price, margin, marginPercent, totalProfit }) => (
                      <div
                        key={product.id}
                        className="bg-gradient-to-br from-white to-stone-50 border-2 border-stone-200 rounded-xl p-5 hover:shadow-xl hover:border-berry-300 transition-all duration-300"
                      >
                        {/* Header con nombre y precio */}
                        <div className="mb-4 pb-4 border-b border-stone-200">
                          <h3 className="font-bold text-berry-950 text-lg mb-2 leading-tight">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-stone-600">Precio de venta:</span>
                            <span className="text-xl font-bold text-berry-600">
                              ${price.toLocaleString('es-CO')}
                            </span>
                          </div>
                        </div>

                        {/* Métricas principales */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border-2 border-blue-200">
                            <div className="text-xs font-medium text-blue-700 mb-1">Vendidos</div>
                            <div className="text-2xl font-bold text-blue-900">{totalSold}</div>
                            <div className="text-xs text-blue-600 mt-1">unidades</div>
                          </div>
                          <div className={`rounded-lg p-3 border-2 ${
                            product.stock <= (product.minStock || 0)
                              ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                              : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                          }`}>
                            <div className={`text-xs font-medium mb-1 ${
                              product.stock <= (product.minStock || 0) ? 'text-red-700' : 'text-green-700'
                            }`}>
                              Stock
                            </div>
                            <div className={`text-2xl font-bold ${
                              product.stock <= (product.minStock || 0) ? 'text-red-900' : 'text-green-900'
                            }`}>
                              {product.stock}
                            </div>
                            <div className={`text-xs mt-1 ${
                              product.stock <= (product.minStock || 0) ? 'text-red-600' : 'text-green-600'
                            }`}>
                              unidades
                            </div>
                          </div>
                        </div>

                        {/* Información de rentabilidad */}
                        {cost > 0 && (
                          <div className="mb-4 p-4 bg-gradient-to-r from-berry-50 via-berry-100 to-purple-50 rounded-lg border-2 border-berry-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-stone-700">Margen de ganancia:</span>
                              <span className={`font-bold text-base ${
                                marginPercent >= 50 ? 'text-green-600' :
                                marginPercent >= 30 ? 'text-blue-600' :
                                marginPercent >= 10 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {marginPercent.toFixed(1)}%
                              </span>
                            </div>
                            {totalProfit > 0 && (
                              <div className="flex justify-between items-center pt-2 border-t-2 border-berry-200">
                                <span className="text-xs font-semibold text-stone-700">Rentabilidad Total:</span>
                                <span className="font-bold text-lg text-green-600">
                                  ${totalProfit.toLocaleString('es-CO')}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Botón Ver Detalles */}
                        <button
                          onClick={() => setSelectedProductDetail(product)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-berry-600 to-berry-700 hover:from-berry-700 hover:to-berry-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver Detalles
                        </button>
                      </div>
                    ))}
                </div>

                {/* Vista Tabla para desktop */}
                <div className="hidden sm:block overflow-x-auto bg-white rounded-xl shadow-lg border border-stone-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-berry-200 bg-berry-50">
                        <th className="px-4 py-3 text-left text-sm font-bold text-berry-950">Producto</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-berry-950">Precio</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-berry-950">Costo</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-berry-950">Margen</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-berry-950">Margen %</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-berry-950">Vendidos</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-berry-950">Stock</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-berry-950">Rentabilidad</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-berry-950">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products
                        .map((product) => {
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

                          return { product, totalSold, cost, price, margin, marginPercent, totalProfit }
                        })
                        .sort((a, b) => b.totalProfit - a.totalProfit)
                        .map(({ product, totalSold, cost, price, margin, marginPercent, totalProfit }) => (
                          <tr key={product.id} className="border-b border-stone-200 hover:bg-stone-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-semibold text-berry-950">
                              {product.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-medium">
                              ${price.toLocaleString('es-CO')}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {cost > 0 ? `$${cost.toLocaleString('es-CO')}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-medium">
                              {cost > 0 ? `$${margin.toLocaleString('es-CO')}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {cost > 0 ? (
                                <span className={`font-bold ${
                                  marginPercent >= 50 ? 'text-green-600' :
                                  marginPercent >= 30 ? 'text-blue-600' :
                                  marginPercent >= 10 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                  {marginPercent.toFixed(1)}%
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-semibold">
                              {totalSold}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {editingStock?.id === product.id ? (
                                <input
                                  type="number"
                                  value={editingStock.stock}
                                  onChange={(e) => setEditingStock({ id: product.id, stock: parseInt(e.target.value) || 0 })}
                                  className="w-20 px-2 py-1 border-2 border-berry-300 rounded-lg text-center text-xs focus:ring-2 focus:ring-berry-500"
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
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                    product.stock <= (product.minStock || 0)
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300'
                                  }`}
                                >
                                  {product.stock}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {cost > 0 ? (
                                <span className={`font-bold ${
                                  totalProfit > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  ${totalProfit.toLocaleString('es-CO')}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setSelectedProductDetail(product)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-berry-600 hover:bg-berry-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Detalles
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleEditProductForSale(product)
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-600 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Ajustar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Nota informativa */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-berry-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-berry-700">
                    <strong>Nota:</strong> El stock se puede ajustar manualmente haciendo clic en el número. 
                    El botón &quot;Ajustar&quot; resta automáticamente las ventas del día actual del stock.
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* Modal de detalle del producto */}
        {(selectedProductDetail || editingProductForSale) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full my-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl sm:text-2xl font-bold text-berry-950">
                  {editingProductForSale ? 'Editar Producto' : 'Detalle del Producto'}
                </h3>
                <button
                  onClick={() => {
                    setSelectedProductDetail(null)
                    setEditingProductForSale(null)
                  }}
                  className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-xl font-bold"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              {editingProductForSale ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSaveProductForSale() }} className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-semibold text-berry-950 mb-1">Nombre del Producto</label>
                    <input
                      type="text"
                      value={productEditForm.name}
                      onChange={(e) => setProductEditForm({ ...productEditForm, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                      required
                    />
                  </div>

                  {/* Precio y Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-berry-950 mb-1">Precio</label>
                      <input
                        type="number"
                        value={productEditForm.price}
                        onChange={(e) => setProductEditForm({ ...productEditForm, price: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                        required
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-berry-950 mb-1">Stock</label>
                      <input
                        type="number"
                        value={productEditForm.stock}
                        onChange={(e) => setProductEditForm({ ...productEditForm, stock: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Tipo y Categoría */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-berry-950 mb-1">Tipo</label>
                      <select
                        value={productEditForm.type}
                        onChange={(e) => setProductEditForm({ ...productEditForm, type: e.target.value as Product['type'] })}
                        className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                        required
                      >
                        <option value="cafeteria">Cafetería</option>
                        <option value="bebida">Bebida</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-berry-950 mb-1">Categoría</label>
                      <select
                        value={productEditForm.category}
                        onChange={(e) => setProductEditForm({ ...productEditForm, category: e.target.value as Product['category'] })}
                        className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                        required
                      >
                        {CATEGORIES[productEditForm.type].map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* URL de Imagen */}
                  <div>
                    <label className="block text-sm font-semibold text-berry-950 mb-1">URL de Imagen (para carrito de compras)</label>
                    <input
                      type="url"
                      value={productEditForm.imageUrl}
                      onChange={(e) => setProductEditForm({ ...productEditForm, imageUrl: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    {productEditForm.imageUrl && (
                      <div className="mt-2">
                        <img src={productEditForm.imageUrl} alt="Vista previa" className="max-w-full h-32 object-contain rounded-lg border border-stone-200" />
                      </div>
                    )}
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-semibold text-berry-950 mb-1">Descripción</label>
                    <textarea
                      value={productEditForm.description}
                      onChange={(e) => setProductEditForm({ ...productEditForm, description: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                      rows={3}
                    />
                  </div>

                  {/* Tamaño, Costo y Stock Mínimo */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-berry-950 mb-1">Tamaño</label>
                      <input
                        type="text"
                        value={productEditForm.size}
                        onChange={(e) => setProductEditForm({ ...productEditForm, size: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                        placeholder="Ej: Grande"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-berry-950 mb-1">Costo</label>
                      <input
                        type="number"
                        value={productEditForm.cost}
                        onChange={(e) => setProductEditForm({ ...productEditForm, cost: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-berry-950 mb-1">Stock Mínimo</label>
                      <input
                        type="number"
                        value={productEditForm.minStock}
                        onChange={(e) => setProductEditForm({ ...productEditForm, minStock: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-berry-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4 border-t border-stone-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProductForSale(null)
                        setSelectedProductDetail(null)
                      }}
                      className="flex-1 px-4 py-2 border-2 border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (() => {
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
                      {product.imageUrl && (
                        <div className="mb-3">
                          <img src={product.imageUrl} alt={product.name} className="w-full max-w-xs h-48 object-contain rounded-lg border border-stone-200 mx-auto" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.type === 'cafeteria' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {product.type}
                        </span>
                        <span className="text-xs text-stone-500">{product.category}</span>
                      </div>
                      {product.description && (
                        <p className="text-sm text-stone-600 mt-2">{product.description}</p>
                      )}
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
                        onClick={() => handleEditProductForSale(product)}
                        className="flex-1 px-4 py-2 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editar Producto
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
                          setSelectedProductDetail(null)
                        }}
                        className="flex-1 px-4 py-2 bg-stone-600 hover:bg-stone-700 text-white font-semibold rounded-lg transition-colors"
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

        {/* Botón flotante para volver al panel - Solo cuando no está en dashboard */}
        {currentView !== 'dashboard' && (
          <button
            onClick={() => setCurrentView('dashboard')}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-stone-700 hover:bg-stone-800 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center z-40"
            title="Volver al Panel de Administración"
            aria-label="Volver al Panel de Administración"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

