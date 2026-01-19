'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Sale {
  id: string
  date: string
  hour: number
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  total: number
  subtotal?: number
  discount?: number
  discountType?: 'percentage' | 'amount'
  discountValue?: number
  comment?: string
  channel: 'presencial' | 'whatsapp'
  paymentMethod?: 'efectivo' | 'nequi'
  ticketNumber?: string
}

interface Product {
  id: string
  name: string
  price: number
  description?: string
  category: string
  type: 'cafeteria' | 'bebida'
  stock?: number
}

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDate, setFilterDate] = useState<string>('')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [editSaleDateTime, setEditSaleDateTime] = useState<string>('')
  const [editSaleComment, setEditSaleComment] = useState<string>('')
  const [editSaleItems, setEditSaleItems] = useState<Sale['items']>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState<string>('')
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [page, setPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    loadSales()
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const products = await response.json()
      setAvailableProducts(products)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  const loadSales = async () => {
    try {
      const response = await fetch(`/api/sales?t=${Date.now()}`)
      const allSales = await response.json()
      // Ordenar por fecha más reciente
      const sorted = allSales.sort((a: Sale, b: Sale) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      setSales(sorted)
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta venta? Se restaurará el stock de los productos.')) {
      return
    }

    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadSales()
        if (selectedSale?.id === saleId) {
          setShowDetail(false)
          setSelectedSale(null)
        }
        alert('Venta eliminada exitosamente')
      } else {
        alert('Error al eliminar la venta')
      }
    } catch (error) {
      console.error('Error deleting sale:', error)
      alert('Error al eliminar la venta')
    }
  }

  const handleUpdateSale = async () => {
    if (!editingSale) return

    try {
      setProcessing(true)
      
      const newDate = new Date(editSaleDateTime)
      const hour = newDate.getHours()
      
      const newTotal = editSaleItems.reduce((sum, item) => sum + item.totalPrice, 0)
      
      const response = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: newDate.toISOString(),
          hour: hour,
          items: editSaleItems,
          total: newTotal,
          paymentMethod: editingSale.paymentMethod,
          channel: editingSale.channel,
          comment: editSaleComment || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[handleUpdateSale] Error del servidor:', error)
        throw new Error(error.error || error.details || 'Error al actualizar la venta')
      }

      await loadSales()
      
      setEditingSale(null)
      setEditSaleDateTime('')
      setEditSaleComment('')
      setEditSaleItems([])
      setShowProductSelector(false)
      setProductSearch('')
      setShowDetail(false)
      setSelectedSale(null)
      
      alert('Venta actualizada correctamente')
    } catch (error: any) {
      console.error('[handleUpdateSale] Error completo:', error)
      const errorMessage = error.message || 'Error desconocido al actualizar la venta'
      alert(`Error al actualizar la venta: ${errorMessage}`)
    } finally {
      setProcessing(false)
    }
  }

  const addProductToSale = (product: Product) => {
    const existingItem = editSaleItems.find(item => item.productId === product.id)
    
    if (existingItem) {
      setEditSaleItems(editSaleItems.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              totalPrice: (item.quantity + 1) * item.unitPrice
            }
          : item
      ))
    } else {
      setEditSaleItems([
        ...editSaleItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price
        }
      ])
    }
    setProductSearch('')
  }

  const removeProductFromSale = (productId: string) => {
    setEditSaleItems(editSaleItems.filter(item => item.productId !== productId))
  }

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProductFromSale(productId)
      return
    }
    
    setEditSaleItems(editSaleItems.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice
          }
        : item
    ))
  }

  const filteredAvailableProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const getEditTotal = () => {
    return editSaleItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  // Filtrar ventas
  let filteredSales = sales

  if (filterDate) {
    const filterYear = parseInt(filterDate.split('-')[0])
    const filterMonth = parseInt(filterDate.split('-')[1])
    const filterDay = parseInt(filterDate.split('-')[2])
    
    filteredSales = filteredSales.filter(sale => {
      const saleDate = new Date(sale.date)
      const saleYear = saleDate.getFullYear()
      const saleMonth = saleDate.getMonth() + 1
      const saleDay = saleDate.getDate()
      
      return saleYear === filterYear && saleMonth === filterMonth && saleDay === filterDay
    })
  }

  if (filterPaymentMethod !== 'all') {
    filteredSales = filteredSales.filter(sale => {
      if (filterPaymentMethod === 'sin-pago') {
        return !sale.paymentMethod
      }
      return sale.paymentMethod === filterPaymentMethod
    })
  }

  // Agrupar ventas por día
  const salesByDay: { [key: string]: Sale[] } = {}
  filteredSales.forEach(sale => {
    const saleDate = new Date(sale.date)
    const year = saleDate.getFullYear()
    const month = saleDate.getMonth() + 1
    const day = saleDate.getDate()
    
    const dayKey = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    
    if (!salesByDay[dayKey]) {
      salesByDay[dayKey] = []
    }
    salesByDay[dayKey].push(sale)
  })

  // Ordenar días (más reciente primero)
  const sortedDays = Object.keys(salesByDay).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-'))
    const dateB = new Date(b.split('/').reverse().join('-'))
    return dateB.getTime() - dateA.getTime()
  })

  // Paginación
  const paginatedDays = sortedDays.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const totalPages = Math.ceil(sortedDays.length / itemsPerPage)

  const getDayTotal = (sales: Sale[]) => {
    return sales.reduce((sum, sale) => sum + sale.total, 0)
  }

  const getDayLabel = (dayKey: string) => {
    const [day, month, year] = dayKey.split('/').map(Number)
    const date = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isToday = date.getTime() === today.getTime()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.getTime() === yesterday.getTime()

    if (isToday) {
      return 'Hoy'
    } else if (isYesterday) {
      return 'Ayer'
    } else {
      const label = date.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      return label.charAt(0).toUpperCase() + label.slice(1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-berry-600 text-xl">Cargando ventas...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-berry-950 mb-1">Todas las Ventas</h1>
            <p className="text-sm text-stone-600">Total: {filteredSales.length} ventas</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded-lg font-medium transition-colors"
          >
            ← Volver
          </button>
        </div>

        {/* Filtros */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-stone-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Filtrar por fecha:
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
              />
              {filterDate && (
                <button
                  onClick={() => {
                    setFilterDate('')
                    setPage(1)
                  }}
                  className="mt-2 text-xs text-berry-600 hover:text-berry-800 font-medium"
                >
                  Limpiar filtro
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Filtrar por método de pago:
              </label>
              <select
                value={filterPaymentMethod}
                onChange={(e) => {
                  setFilterPaymentMethod(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="nequi">Nequi</option>
                <option value="sin-pago">Sin pago</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de ventas */}
        {sortedDays.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-stone-500 text-lg">No hay ventas con los filtros seleccionados</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedDays.map((dayKey) => {
                const daySales = salesByDay[dayKey]
                const dayTotal = getDayTotal(daySales)
                const dayLabel = getDayLabel(dayKey)

                return (
                  <div key={dayKey} className="border-2 border-stone-200 rounded-lg overflow-hidden bg-white">
                    {/* Encabezado del día */}
                    <div className="bg-gradient-to-r from-berry-600 to-purple-600 text-white px-4 py-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-lg">{dayLabel}</h4>
                        <p className="text-sm text-berry-100">
                          {daySales.length} {daySales.length === 1 ? 'venta' : 'ventas'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-berry-100">Total del día:</p>
                        <p className="font-bold text-xl">${formatPrice(dayTotal)}</p>
                      </div>
                    </div>

                    {/* Lista de ventas del día */}
                    <div className="p-4 space-y-3">
                      {daySales
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((sale) => {
                          const saleDate = new Date(sale.date)
                          return (
                            <div
                              key={sale.id}
                              className="border border-stone-200 rounded-lg p-3 sm:p-4 hover:bg-stone-50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="font-semibold text-berry-950 text-sm sm:text-base">
                                      {saleDate.toLocaleTimeString('es-CO', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                    {sale.paymentMethod && (
                                      <span className="px-2 py-1 bg-berry-100 text-berry-700 rounded text-xs font-medium">
                                        {sale.paymentMethod}
                                      </span>
                                    )}
                                    {!sale.paymentMethod && (
                                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                        Sin pago
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-stone-600">
                                    {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}
                                  </div>
                                  {sale.comment && (
                                    <div className="text-xs text-stone-500 mt-1 italic line-clamp-2">
                                      &quot;{sale.comment}&quot;
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                                  <span className="text-lg sm:text-xl font-bold text-berry-600">
                                    ${formatPrice(sale.total)}
                                  </span>
                                </div>
                              </div>

                              {/* Botones */}
                              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-stone-200">
                                <button
                                  onClick={() => {
                                    setSelectedSale(sale)
                                    setShowDetail(true)
                                  }}
                                  className="flex-1 px-4 py-2 bg-berry-600 hover:bg-berry-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  Ver Detalle
                                </button>
                                <button
                                  onClick={() => handleDeleteSale(sale.id)}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-stone-700 font-medium">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalle de venta */}
      {showDetail && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-berry-950">Detalle de Venta</h3>
              <button
                onClick={() => {
                  setShowDetail(false)
                  setSelectedSale(null)
                }}
                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Información */}
              <div className="bg-stone-50 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">Código de Venta:</span>
                    <p className="text-sm sm:text-base text-berry-600 font-mono font-semibold">{selectedSale.id}</p>
                  </div>
                  <div>
                    <span className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">Fecha y Hora:</span>
                    <p className="text-sm sm:text-base text-stone-600">
                      {new Date(selectedSale.date).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {selectedSale.paymentMethod && (
                    <div>
                      <span className="block text-xs sm:text-sm font-semibold text-stone-700 mb-1">Método de pago:</span>
                      <p className="text-sm sm:text-base text-stone-600 capitalize">{selectedSale.paymentMethod}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div>
                <h4 className="font-semibold text-berry-950 mb-3">Productos:</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, index) => (
                    <div key={index} className="bg-stone-50 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-berry-950 text-sm sm:text-base mb-1">
                            {item.productName}
                          </div>
                          <div className="text-xs sm:text-sm text-stone-600">
                            Cantidad: {item.quantity} × ${formatPrice(item.unitPrice)} c/u
                          </div>
                        </div>
                        <span className="font-semibold text-berry-600 text-base sm:text-lg">
                          ${formatPrice(item.totalPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSale.comment && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                  <span className="block text-xs sm:text-sm font-semibold text-amber-800 mb-1">Comentario:</span>
                  <p className="text-sm sm:text-base text-amber-700">{selectedSale.comment}</p>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-stone-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold text-berry-950">Total:</span>
                  <span className="text-xl sm:text-2xl font-bold text-berry-600">
                    ${formatPrice(selectedSale.total)}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-stone-200">
                <button
                  onClick={() => {
                    const saleDate = new Date(selectedSale.date)
                    const year = saleDate.getFullYear()
                    const month = String(saleDate.getMonth() + 1).padStart(2, '0')
                    const day = String(saleDate.getDate()).padStart(2, '0')
                    const hours = String(selectedSale.hour !== undefined ? selectedSale.hour : saleDate.getHours()).padStart(2, '0')
                    const minutes = String(saleDate.getMinutes()).padStart(2, '0')
                    setEditingSale(selectedSale)
                    setEditSaleDateTime(`${year}-${month}-${day}T${hours}:${minutes}`)
                    setEditSaleComment(selectedSale.comment || '')
                    setEditSaleItems([...selectedSale.items])
                    setShowProductSelector(false)
                    setProductSearch('')
                    setShowDetail(false)
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                >
                  ✏️ Editar Venta
                </button>
                <button
                  onClick={() => handleDeleteSale(selectedSale.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm sm:text-base"
                >
                  🗑️ Eliminar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de venta */}
      {editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-berry-950">Editar Venta</h3>
              <button
                onClick={() => {
                  setEditingSale(null)
                  setEditSaleDateTime('')
                  setEditSaleComment('')
                  setEditSaleItems([])
                  setShowProductSelector(false)
                  setProductSearch('')
                }}
                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors text-xl font-bold"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  📅 Fecha y Hora:
                </label>
                <input
                  type="datetime-local"
                  value={editSaleDateTime}
                  onChange={(e) => setEditSaleDateTime(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-stone-500 mt-1">Selecciona la fecha y hora de la venta</p>
              </div>

              {/* Productos de la venta */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-stone-700">
                    🛒 Productos:
                  </label>
                  <button
                    onClick={() => setShowProductSelector(!showProductSelector)}
                    className="px-3 py-1.5 bg-berry-600 hover:bg-berry-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {showProductSelector ? '✕ Cancelar' : '+ Agregar Producto'}
                  </button>
                </div>

                {/* Selector de productos */}
                {showProductSelector && (
                  <div className="mb-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredAvailableProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addProductToSale(product)}
                          className="w-full text-left px-3 py-2 bg-white hover:bg-berry-50 border border-stone-200 rounded-lg transition-colors flex justify-between items-center"
                        >
                          <span className="text-sm font-medium text-berry-950">{product.name}</span>
                          <span className="text-sm text-berry-600 font-semibold">${formatPrice(product.price)}</span>
                        </button>
                      ))}
                      {filteredAvailableProducts.length === 0 && (
                        <p className="text-sm text-stone-500 text-center py-2">No se encontraron productos</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de productos en la venta */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {editSaleItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-berry-950">{item.productName}</div>
                        <div className="text-xs text-stone-600">${formatPrice(item.unitPrice)} c/u</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateProductQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-stone-200 hover:bg-stone-300 rounded text-sm font-bold"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateProductQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-berry-600 hover:bg-berry-700 text-white rounded text-sm font-bold"
                        >
                          +
                        </button>
                        <span className="w-20 text-right font-semibold text-berry-600">
                          ${formatPrice(item.totalPrice)}
                        </span>
                        <button
                          onClick={() => removeProductFromSale(item.productId)}
                          className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded text-sm font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  {editSaleItems.length === 0 && (
                    <p className="text-sm text-stone-500 text-center py-4 bg-stone-50 rounded-lg">
                      No hay productos en esta venta
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  💬 Comentario:
                </label>
                <textarea
                  value={editSaleComment}
                  onChange={(e) => setEditSaleComment(e.target.value)}
                  placeholder="Ej: Consumo propio, nota especial, etc."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <p className="text-xs text-stone-500 mt-1">Opcional: agrega un comentario a esta venta</p>
              </div>

              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-sm text-stone-600">
                  <span className="font-semibold">Total:</span> <span className="text-lg font-bold text-berry-600">${formatPrice(getEditTotal())}</span>
                </p>
                <p className="text-sm text-stone-600">
                  <span className="font-semibold">Productos:</span> {editSaleItems.length}
                </p>
                {editingSale.paymentMethod && (
                  <p className="text-sm text-stone-600">
                    <span className="font-semibold">Método de pago:</span> {editingSale.paymentMethod}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateSale}
                  disabled={processing || !editSaleDateTime || editSaleItems.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-400 text-white rounded-lg font-medium transition-colors"
                >
                  {processing ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  onClick={() => {
                    setEditingSale(null)
                    setEditSaleDateTime('')
                    setEditSaleComment('')
                    setEditSaleItems([])
                    setShowProductSelector(false)
                    setProductSearch('')
                  }}
                  className="flex-1 px-4 py-2 bg-stone-300 hover:bg-stone-400 text-stone-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
