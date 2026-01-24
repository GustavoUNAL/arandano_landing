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
  const [editSalePaymentMethod, setEditSalePaymentMethod] = useState<string>('')
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
          paymentMethod: editSalePaymentMethod || undefined,
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
      setEditSalePaymentMethod('')
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
      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-6xl">
        {/* Header con paleta de la app */}
        <div className="mb-5 relative">
          <button
            onClick={() => router.back()}
            className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-berry-700 hover:text-berry-800 hover:bg-berry-50 rounded-lg transition-colors border border-berry-200"
          >
            ← Volver
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-berry-950">Ventas</h1>
            <p className="text-xs text-stone-600 mt-0.5 font-medium">{filteredSales.length} ventas</p>
          </div>
        </div>

        {/* Filtros con paleta de la app en una sola fila */}
        <div className="mb-5 p-3 bg-white rounded-xl border border-berry-200 shadow-sm">
          <div className="flex items-center justify-center gap-2.5 flex-nowrap overflow-x-auto">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-berry-50 rounded-lg border border-berry-200 hover:border-berry-300 hover:bg-berry-100 transition-all flex-shrink-0">
              <span className="text-xs text-berry-600">📅</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value)
                  setPage(1)
                }}
                className="text-xs font-medium border-0 focus:ring-0 focus:outline-none bg-transparent text-stone-700 min-w-[125px]"
              />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-300 hover:bg-purple-100 transition-all flex-shrink-0">
              <span className="text-xs text-purple-600">💳</span>
              <select
                value={filterPaymentMethod}
                onChange={(e) => {
                  setFilterPaymentMethod(e.target.value)
                  setPage(1)
                }}
                className="text-xs font-medium border-0 focus:ring-0 focus:outline-none bg-transparent text-stone-700 cursor-pointer min-w-[105px]"
              >
                <option value="all">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="nequi">Nequi</option>
                <option value="sin-pago">Sin pago</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-pink-50 rounded-lg border border-pink-200 hover:border-pink-300 hover:bg-pink-100 transition-all flex-shrink-0">
              <span className="text-xs text-pink-600">🔍</span>
              <input
                type="text"
                placeholder="Buscar..."
                className="text-xs font-medium border-0 focus:ring-0 focus:outline-none bg-transparent text-stone-700 placeholder-stone-400 w-28"
              />
            </div>
            {(filterDate || filterPaymentMethod !== 'all') && (
              <button
                onClick={() => {
                  setFilterDate('')
                  setFilterPaymentMethod('all')
                  setPage(1)
                }}
                className="px-2.5 py-2 text-xs font-medium text-berry-700 hover:text-berry-800 hover:bg-berry-100 rounded-lg transition-colors border border-berry-200 bg-white flex-shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Lista de ventas */}
        {sortedDays.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-berry-200 shadow-sm">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-stone-700 text-sm font-medium">No hay ventas con los filtros seleccionados</p>
            <p className="text-stone-500 text-xs mt-1">Intenta ajustar los filtros</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedDays.map((dayKey) => {
                const daySales = salesByDay[dayKey]
                const dayTotal = getDayTotal(daySales)
                const dayLabel = getDayLabel(dayKey)

                return (
                  <div key={dayKey} className="border border-berry-200 rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-all mb-4">
                    {/* Encabezado del día con paleta de la app */}
                    <div className="bg-gradient-to-r from-berry-600 to-purple-600 px-4 py-3 border-b border-berry-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-1 h-6 bg-white/30 rounded-full"></div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{dayLabel}</h4>
                            <span className="text-[10px] text-white/90 font-medium bg-white/20 px-2 py-0.5 rounded-full">
                              {daySales.length} {daySales.length === 1 ? 'venta' : 'ventas'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white/95 px-4 py-2 rounded-lg shadow-md border border-white/50">
                          <span className="text-sm font-bold text-berry-700">${formatPrice(dayTotal)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Lista de ventas del día */}
                    <div className="divide-y divide-stone-100">
                      {daySales
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((sale) => {
                          const saleDate = new Date(sale.date)
                          return (
                            <div
                              key={sale.id}
                              className="p-4 hover:bg-berry-50/50 transition-all border-l-3 border-transparent hover:border-berry-300"
                            >
                              {/* Header con paleta de la app */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <div className="flex items-center gap-1 px-2 py-1 bg-berry-100 rounded-lg border border-berry-200">
                                      <span className="text-xs text-berry-600">🕐</span>
                                      <span className="text-xs font-semibold text-berry-900">
                                        {saleDate.toLocaleTimeString('es-CO', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    {sale.paymentMethod && (
                                      <span className={`text-[10px] px-2 py-1 rounded-lg font-medium border ${
                                        sale.paymentMethod === 'efectivo' 
                                          ? 'bg-green-100 text-green-800 border-green-300' 
                                          : 'bg-blue-100 text-blue-800 border-blue-300'
                                      }`}>
                                        {sale.paymentMethod}
                                      </span>
                                    )}
                                    {!sale.paymentMethod && (
                                      <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 font-medium">
                                        Sin pago
                                      </span>
                                    )}
                                    <span className="text-[10px] text-stone-600 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200 font-medium">
                                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                                    </span>
                                  </div>
                                  {sale.comment && (
                                    <div className="text-[10px] text-stone-700 italic line-clamp-1 mt-1.5 bg-berry-50 px-2.5 py-1 rounded-lg border-l-3 border-berry-400">
                                      💬 {sale.comment}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end justify-start gap-1.5 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      setSelectedSale(sale)
                                      setShowDetail(true)
                                    }}
                                    className="text-lg hover:scale-110 transition-transform active:scale-95 opacity-60 hover:opacity-100 mb-0.5"
                                    title="Ver más detalles"
                                  >
                                    ⚙️
                                  </button>
                                  <div className="bg-gradient-to-br from-berry-500 to-purple-500 px-3.5 py-2 rounded-lg border border-berry-300 shadow-sm">
                                    <span className="text-sm font-bold text-white whitespace-nowrap">
                                      ${formatPrice(sale.total)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Paginación con paleta de la app */}
            {totalPages > 1 && (
              <div className="mt-5 flex justify-center items-center gap-2.5">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-2 text-xs font-medium text-berry-700 hover:text-white hover:bg-berry-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all border border-berry-300 shadow-sm hover:shadow-md"
                >
                  Anterior
                </button>
                <span className="px-3.5 py-2 text-xs text-berry-700 font-semibold bg-berry-50 rounded-lg border border-berry-200">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3.5 py-2 text-xs font-medium text-berry-700 hover:text-white hover:bg-berry-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all border border-berry-300 shadow-sm hover:shadow-md"
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-5 max-w-2xl w-full my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-stone-200">
              <h3 className="text-lg sm:text-xl font-semibold text-stone-900">Detalle de Venta</h3>
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => {
                    setShowDetail(false)
                    setSelectedSale(null)
                  }}
                  className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
                >
                  ×
                </button>
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
                    setEditSalePaymentMethod(selectedSale.paymentMethod || '')
                    setShowProductSelector(false)
                    setProductSearch('')
                    setShowDetail(false)
                  }}
                  className="text-2xl hover:scale-110 transition-transform"
                  title="Editar Venta"
                >
                  ⚙️
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Información minimalista */}
              <div className="space-y-2 pb-3 border-b border-stone-100">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Fecha:</span>
                  <span className="text-stone-700">
                    {new Date(selectedSale.date).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {selectedSale.paymentMethod && (
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Método de pago:</span>
                    <span className="text-stone-700 capitalize">{selectedSale.paymentMethod}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>ID:</span>
                  <span className="text-stone-400 font-mono text-[10px]">{selectedSale.id}</span>
                </div>
              </div>

              {/* Productos */}
              <div>
                <h4 className="text-xs font-semibold text-stone-700 mb-2 uppercase tracking-wide">Productos</h4>
                <div className="space-y-1 divide-y divide-stone-100">
                  {selectedSale.items.map((item, index) => (
                    <div key={index} className="py-2">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-stone-900">
                            {item.productName}
                          </div>
                          <div className="text-xs text-stone-500 mt-0.5">
                            {item.quantity} × ${formatPrice(item.unitPrice)}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-stone-700 whitespace-nowrap">
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

              {/* Botón Cerrar */}
              <div className="pt-4 border-t border-stone-200">
                <button
                  onClick={() => {
                    setShowDetail(false)
                    setSelectedSale(null)
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-berry-500 to-purple-500 hover:from-berry-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  Cerrar
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
                  setEditSalePaymentMethod('')
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

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  💳 Método de Pago:
                </label>
                <select
                  value={editSalePaymentMethod}
                  onChange={(e) => setEditSalePaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin pago</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="nequi">Nequi</option>
                </select>
                <p className="text-xs text-stone-500 mt-1">Selecciona el método de pago utilizado</p>
              </div>

              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-sm text-stone-600">
                  <span className="font-semibold">Total:</span> <span className="text-lg font-bold text-berry-600">${formatPrice(getEditTotal())}</span>
                </p>
                <p className="text-sm text-stone-600">
                  <span className="font-semibold">Productos:</span> {editSaleItems.length}
                </p>
                <p className="text-sm text-stone-600">
                  <span className="font-semibold">Método de pago:</span> {editSalePaymentMethod || 'Sin pago'}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-stone-200">
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateSale}
                    disabled={processing || !editSaleDateTime || editSaleItems.length === 0}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-stone-400 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                  >
                    {processing ? 'Guardando...' : '💾 Guardar Cambios'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSale(null)
                      setEditSaleDateTime('')
                      setEditSaleComment('')
                      setEditSaleItems([])
                      setEditSalePaymentMethod('')
                      setShowProductSelector(false)
                      setProductSearch('')
                    }}
                    className="flex-1 px-4 py-2.5 bg-stone-300 hover:bg-stone-400 text-stone-700 rounded-lg font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (editingSale && confirm('¿Estás seguro de eliminar esta venta? Se restaurará el stock de los productos.')) {
                      handleDeleteSale(editingSale.id)
                      setEditingSale(null)
                      setEditSaleDateTime('')
                      setEditSaleComment('')
                      setEditSaleItems([])
                      setEditSalePaymentMethod('')
                      setShowProductSelector(false)
                      setProductSearch('')
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span>🗑️</span>
                  <span>Eliminar Venta</span>
                </button>
                <button
                  onClick={() => {
                    setEditingSale(null)
                    setEditSaleDateTime('')
                    setEditSaleComment('')
                    setEditSaleItems([])
                    setEditSalePaymentMethod('')
                    setShowProductSelector(false)
                    setProductSearch('')
                  }}
                  className="w-full px-4 py-2.5 bg-stone-300 hover:bg-stone-400 text-stone-700 rounded-lg font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
