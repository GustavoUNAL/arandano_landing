'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  unitPrice: number
  totalValue: number
  code?: string
  purchaseDate?: string
  supplier?: string
  lot?: string
  notes?: string
}

const CATEGORIES = ['Insumos', 'Bebidas', 'Limpieza', 'Activos', 'Otros']

export default function InventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    loadInventory()
  }, [])

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  const loadInventory = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory')
      const data = await response.json()
      setItems(data)
    } catch (error) {
      showAlert('error', 'Error al cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!confirm('¿Importar inventario desde Excel? Esto actualizará los items existentes.')) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/inventory/import', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        showAlert('success', 'Inventario importado exitosamente')
        await loadInventory()
      } else {
        showAlert('error', data.error || 'Error al importar inventario')
      }
    } catch (error) {
      showAlert('error', 'Error al importar inventario')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item => {
    const matchesCategory = !filterCategory || item.category === filterCategory
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const totalValue = filteredItems.reduce((sum, item) => sum + (item.totalValue || 0), 0)

  return (
    <div className="min-h-screen bg-stone-50 py-4 sm:py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Alertas */}
        {alert && (
          <div className={`fixed top-4 right-4 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-xl flex items-center gap-3 transform transition-all duration-300 ease-in-out ${
            alert.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          } animate-fade-in-up max-w-sm`}>
            <span className="text-xl font-bold">
              {alert.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="font-medium text-sm sm:text-base">{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              className="ml-4 text-white hover:text-stone-200 transition-colors"
              aria-label="Cerrar alerta"
            >
              ✕
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-berry-950 mb-2">
                📦 Inventario Interno
              </h1>
              <p className="text-sm sm:text-base text-stone-600">
                Gestión de insumos, limpieza, activos y materiales
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={handleImport}
                disabled={loading}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    <span>Importar desde Excel</span>
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="w-full sm:w-auto px-4 py-3 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
              >
                ← Volver a Admin
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Resumen */}
          <div className="bg-berry-50 border border-berry-200 rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <div className="text-sm text-berry-700">Total items: <span className="font-bold">{filteredItems.length}</span></div>
                <div className="text-sm text-berry-700">Valor total: <span className="font-bold">${totalValue.toLocaleString('es-CO')}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Items */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          {loading && !items.length ? (
            <div className="text-center py-8 text-berry-600">Cargando...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-berry-600">No hay items de inventario</div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-stone-50 border-2 border-stone-200 rounded-lg p-4 sm:p-5 hover:border-berry-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base sm:text-lg text-berry-950">
                          {item.name}
                        </h3>
                        <span className="px-2 py-1 bg-berry-100 text-berry-700 rounded text-xs font-medium">
                          {item.category}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
                        <div>
                          <span className="text-stone-600">Cantidad:</span>
                          <span className="font-semibold ml-1">{item.quantity} {item.unit}</span>
                        </div>
                        <div>
                          <span className="text-stone-600">Precio unit:</span>
                          <span className="font-semibold ml-1">${item.unitPrice.toLocaleString('es-CO')}</span>
                        </div>
                        <div>
                          <span className="text-stone-600">Valor total:</span>
                          <span className="font-semibold ml-1 text-berry-700">${item.totalValue.toLocaleString('es-CO')}</span>
                        </div>
                        {item.code && (
                          <div>
                            <span className="text-stone-600">Código:</span>
                            <span className="font-semibold ml-1">{item.code}</span>
                          </div>
                        )}
                      </div>
                      {(item.supplier || item.lot || item.purchaseDate) && (
                        <div className="mt-2 text-xs text-stone-500">
                          {item.supplier && <span>Proveedor: {item.supplier}</span>}
                          {item.lot && <span className="ml-3">Lote: {item.lot}</span>}
                          {item.purchaseDate && (
                            <span className="ml-3">
                              Compra: {new Date(item.purchaseDate).toLocaleDateString('es-CO')}
                            </span>
                          )}
                        </div>
                      )}
                      {item.notes && (
                        <div className="mt-2 text-sm text-stone-600 italic">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

