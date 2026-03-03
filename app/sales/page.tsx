'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DaySalesBlock } from '@/components/sales/DaySalesBlock'

/** Parsea fecha tipo YYYY-MM-DD como fecha local para que el día de la semana coincida (evita UTC). */
function parseSaleDate(dateStr: string, hour?: number): Date {
  const s = dateStr.split('T')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    if (hour !== undefined) date.setHours(hour, 0, 0, 0)
    return date
  }
  const date = new Date(dateStr)
  if (hour !== undefined) date.setHours(hour, 0, 0, 0)
  return date
}

/** Devuelve dayKey (dd/mm/yyyy) para una venta usando fecha local. */
function getSaleDayKey(sale: { date: string }): string {
  const date = parseSaleDate(sale.date)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

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
  mesa?: string
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
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [hasExpandedInitial, setHasExpandedInitial] = useState(false)

  useEffect(() => {
    loadSales()
    loadProducts()
  }, [])

  // Recargar ventas al volver a esta pestaña (p. ej. después de cobrar en mesero)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadSales()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // Expandir el primer día (hoy o el más reciente) por defecto al cargar (solo una vez)
  useEffect(() => {
    if (!hasExpandedInitial) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const y = today.getFullYear()
      const m = today.getMonth() + 1
      const d = today.getDate()
      const firstDayKey = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
      setExpandedDays(new Set([firstDayKey]))
      setHasExpandedInitial(true)
    }
  }, [hasExpandedInitial])

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
      const response = await fetch(`/api/sales?t=${Date.now()}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) {
        console.error('[Ventas] Error al cargar:', data?.message || data?.error)
        setSales([])
        return
      }
      const allSales = Array.isArray(data) ? data : []
      const sorted = allSales.sort((a: Sale, b: Sale) =>
        parseSaleDate(b.date, b.hour).getTime() - parseSaleDate(a.date, a.hour).getTime()
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
      
      const dateOnly = editSaleDateTime.slice(0, 10)
      const newDate = new Date(editSaleDateTime)
      const hour = newDate.getHours()

      const newTotal = editSaleItems.reduce((sum, item) => sum + item.totalPrice, 0)

      const response = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateOnly,
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

      const updatedSale = await response.json()
      await loadSales()

      setEditingSale(null)
      setEditSaleDateTime('')
      setEditSaleComment('')
      setEditSaleItems([])
      setEditSalePaymentMethod('')
      setShowProductSelector(false)
      setProductSearch('')

      const newDayKey = getSaleDayKey(updatedSale)
      setExpandedDays((prev) => new Set([...prev, newDayKey]))
      setSelectedSale(updatedSale)
      setShowDetail(true)

      setTimeout(() => {
        const el = document.getElementById(`day-${newDayKey.replace(/\//g, '-')}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 400)

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
      const saleDate = parseSaleDate(sale.date)
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

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    filteredSales = filteredSales.filter(sale => {
      const matchComment = sale.comment?.toLowerCase().includes(q)
      const matchMesa = sale.mesa?.toLowerCase().includes(q)
      const matchItems = sale.items.some(
        item => item.productName?.toLowerCase().includes(q)
      )
      return matchComment || matchMesa || matchItems
    })
  }

  // Agrupar ventas por día (fecha local para que jueves 5 = jueves)
  const salesByDay: { [key: string]: Sale[] } = {}
  filteredSales.forEach(sale => {
    const dayKey = getSaleDayKey(sale)
    if (!salesByDay[dayKey]) salesByDay[dayKey] = []
    salesByDay[dayKey].push(sale)
  })

  // Días disponibles según las ventas (todos los días con al menos una venta)
  const allDayKeys = useMemo(() => {
    const keys = Object.keys(salesByDay)
    return keys.sort((a, b) => {
      const [da, ma, ya] = a.split('/').map(Number)
      const [db, mb, yb] = b.split('/').map(Number)
      const dateA = new Date(ya, ma - 1, da)
      const dateB = new Date(yb, mb - 1, db)
      return dateB.getTime() - dateA.getTime()
    })
  }, [salesByDay])

  // Meses a mostrar en el calendario: desde el primer día con ventas hasta hoy, agrupados por mes
  const calendarMonths = useMemo(() => {
    if (allDayKeys.length === 0) return [] as {
      year: number
      monthIndex: number
      label: string
      cells: (string | null)[]
    }[]

    const parseKeyToDate = (key: string) => {
      const [d, m, y] = key.split('/').map(Number)
      return new Date(y, m - 1, d)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let minDate = parseKeyToDate(allDayKeys[allDayKeys.length - 1])
    minDate.setHours(0, 0, 0, 0)

    const months: { year: number; monthIndex: number; label: string; cells: (string | null)[] }[] = []

    let year = minDate.getFullYear()
    let monthIndex = minDate.getMonth()
    const endYear = today.getFullYear()
    const endMonthIndex = today.getMonth()

    while (year < endYear || (year === endYear && monthIndex <= endMonthIndex)) {
      const firstOfMonth = new Date(year, monthIndex, 1)
      const startWeekday = firstOfMonth.getDay() // 0=Domingo
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
      const cells: (string | null)[] = []

      for (let i = 0; i < startWeekday; i++) {
        cells.push(null)
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const current = new Date(year, monthIndex, day)
        current.setHours(0, 0, 0, 0)
        if (current > today) break // no mostrar días futuros
        const dd = String(day).padStart(2, '0')
        const mm = String(monthIndex + 1).padStart(2, '0')
        const key = `${dd}/${mm}/${year}`
        cells.push(key)
      }

      const labelDate = new Date(year, monthIndex, 1)
      const labelRaw = labelDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
      const label = labelRaw.charAt(0).toUpperCase() + labelRaw.slice(1)

      months.push({ year, monthIndex, label, cells })

      monthIndex++
      if (monthIndex > 11) {
        monthIndex = 0
        year++
      }
    }

    return months
  }, [allDayKeys])

  const getDayTotal = (sales: Sale[]) => {
    return sales.reduce((sum, sale) => sum + sale.total, 0)
  }

  const getDayByPayment = (sales: Sale[]) => {
    const efectivo = sales.filter(s => s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0)
    const nequi = sales.filter(s => s.paymentMethod === 'nequi').reduce((sum, s) => sum + s.total, 0)
    const sinPago = sales.filter(s => !s.paymentMethod).reduce((sum, s) => sum + s.total, 0)
    return { efectivo, nequi, sinPago }
  }

  const getSaleItemsSummary = (sale: Sale, maxItems = 3) => {
    return sale.items
      .slice(0, maxItems)
      .map(item => `${item.quantity}× ${item.productName}`)
      .join(', ') + (sale.items.length > maxItems ? ` +${sale.items.length - maxItems} más` : '')
  }

  const toggleDayExpanded = (dayKey: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey)
    } else {
      newExpanded.add(dayKey)
    }
    setExpandedDays(newExpanded)
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

    const dateInParens = date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    if (isToday) {
      return `Hoy (${dateInParens})`
    } else if (isYesterday) {
      return `Ayer (${dateInParens})`
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
        <div className="text-arandano-600 text-xl">Cargando ventas...</div>
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
            className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-arandano-700 hover:text-arandano-800 hover:bg-arandano-50 rounded-lg transition-colors border border-arandano-200"
          >
            ← Volver
          </button>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-arandano-950">Ventas</h1>
            <p className="text-xs text-stone-600 mt-0.5 font-medium">
              {filteredSales.length} {filteredSales.length === 1 ? 'venta' : 'ventas'}
              {filteredSales.length > 0 && (
                <span className="text-arandano-600 font-semibold ml-1">
                  · Total ${formatPrice(filteredSales.reduce((sum, s) => sum + s.total, 0))}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Filtros con paleta de la app en una sola fila */}
        <div className="mb-5 p-3 bg-white rounded-xl border border-arandano-200 shadow-sm">
          <div className="flex items-center justify-center gap-2.5 flex-nowrap overflow-x-auto">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-arandano-50 rounded-lg border border-arandano-200 hover:border-arandano-300 hover:bg-arandano-100 transition-all flex-shrink-0">
              <span className="text-xs text-arandano-600">📅</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value)
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
                }}
                className="text-xs font-medium border-0 focus:ring-0 focus:outline-none bg-transparent text-stone-700 cursor-pointer min-w-[105px]"
              >
                <option value="all">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="nequi">Nequi</option>
                <option value="sin-pago">Sin pago</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-pink-50 rounded-lg border border-pink-200 hover:border-pink-300 hover:bg-pink-100 transition-all flex-shrink-0 min-w-[120px]">
              <span className="text-xs text-pink-600">🔍</span>
              <input
                type="text"
                placeholder="Producto o comentario..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                }}
                className="text-xs font-medium border-0 focus:ring-0 focus:outline-none bg-transparent text-stone-700 placeholder-stone-400 flex-1 min-w-0"
              />
            </div>
            {(filterDate || filterPaymentMethod !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setFilterDate('')
                  setFilterPaymentMethod('all')
                  setSearchQuery('')
                }}
                className="px-2.5 py-2 text-xs font-medium text-arandano-700 hover:text-arandano-800 hover:bg-arandano-50 rounded-lg transition-colors border border-arandano-200 bg-white flex-shrink-0"
              >
                ✕
              </button>
            )}
            <Link
              href="/waiter"
              className="px-3 py-2 text-xs font-medium text-arandano-700 hover:text-arandano-800 bg-arandano-50 hover:bg-arandano-100 rounded-lg transition-colors border border-arandano-200 flex-shrink-0"
            >
              📅 Registrar venta en fecha pasada
            </Link>
          </div>
        </div>

        {/* Calendarios mensuales de ventas (desktop) */}
        {calendarMonths.length > 0 && (
          <div className="hidden md:block mb-5 space-y-6">
            {[...calendarMonths].reverse().map((month) => (
              <div key={`${month.year}-${month.monthIndex}`}>
                <h2 className="text-sm font-semibold text-arandano-900 mb-2">
                  {month.label}
                </h2>
                <div className="grid grid-cols-7 gap-2 text-[11px] font-semibold text-stone-500 mb-1">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
                    <div key={d} className="text-center uppercase tracking-wide">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {month.cells.map((key, idx) => {
                    if (!key) {
                      return <div key={`empty-${month.year}-${month.monthIndex}-${idx}`} className="h-16" />
                    }
                    const daySales = salesByDay[key] ?? []
                    const total = getDayTotal(daySales)
                    const [d, m, y] = key.split('/').map(Number)
                    const date = new Date(y, m - 1, d)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const isToday = date.toDateString() === today.toDateString()

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          toggleDayExpanded(key)
                          const el = document.getElementById(`day-${key.replace(/\//g, '-')}`)
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                        className={`flex flex-col items-start justify-between p-2.5 rounded-xl border text-left transition-colors hover:shadow-sm h-20 ${
                          isToday
                            ? 'bg-arandano-100 border-arandano-400'
                            : total > 0
                              ? 'bg-arandano-50 border-arandano-200 hover:bg-arandano-100'
                              : 'bg-pink-50 border-pink-200'
                        }`}
                      >
                        <span className="text-[11px] font-semibold text-arandano-800">
                          {d}
                        </span>
                        <span className="mt-auto text-[11px] text-stone-600">Total</span>
                        <span className="text-xs font-bold text-arandano-900">
                          ${formatPrice(total)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle de venta */}
      {showDetail && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-5 max-w-2xl w-full my-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-stone-200">
              <h3 className="text-lg sm:text-xl font-semibold text-stone-900">Detalle de Venta</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const saleDate = parseSaleDate(selectedSale.date, selectedSale.hour ?? 0)
                    const year = saleDate.getFullYear()
                    const month = String(saleDate.getMonth() + 1).padStart(2, '0')
                    const day = String(saleDate.getDate()).padStart(2, '0')
                    const hours = String(saleDate.getHours()).padStart(2, '0')
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
                  className="px-3 py-1.5 text-sm font-semibold text-arandano-700 hover:text-arandano-800 bg-arandano-50 hover:bg-arandano-100 rounded-lg border border-arandano-200 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => {
                    setShowDetail(false)
                    setSelectedSale(null)
                  }}
                  className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Información minimalista */}
              <div className="space-y-2 pb-3 border-b border-stone-100">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Fecha:</span>
                  <span className="text-stone-700">
                    {parseSaleDate(selectedSale.date, selectedSale.hour ?? 0).toLocaleDateString('es-CO', {
                      weekday: 'long',
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

              {(selectedSale.mesa || selectedSale.comment) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 space-y-2">
                  {selectedSale.mesa && (
                    <div>
                      <span className="block text-xs sm:text-sm font-semibold text-amber-800 mb-1">Mesa / Ubicación:</span>
                      <p className="text-sm sm:text-base text-amber-700">🪑 {selectedSale.mesa}</p>
                    </div>
                  )}
                  {selectedSale.comment && (
                    <div>
                      <span className="block text-xs sm:text-sm font-semibold text-amber-800 mb-1">Comentario:</span>
                      <p className="text-sm sm:text-base text-amber-700">{selectedSale.comment}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Total */}
              <div className="border-t border-stone-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-base sm:text-lg font-semibold text-arandano-950">Total:</span>
                  <span className="text-xl sm:text-2xl font-bold text-arandano-600">
                    ${formatPrice(selectedSale.total)}
                  </span>
                </div>
              </div>

              {/* Botones Cerrar y Eliminar */}
              <div className="pt-4 border-t border-stone-200 space-y-2">
                <button
                  onClick={() => {
                    setShowDetail(false)
                    setSelectedSale(null)
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-arandano-600 to-arandano-700 hover:from-arandano-700 hover:to-arandano-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    if (selectedSale && confirm('¿Eliminar esta venta? Se restaurará el stock de los productos.')) {
                      handleDeleteSale(selectedSale.id)
                      setShowDetail(false)
                      setSelectedSale(null)
                    }
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                  Eliminar venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de venta */}
      {editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-arandano-950">Editar Venta</h3>
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
                    className="px-3 py-1.5 bg-arandano-600 hover:bg-arandano-700 text-white rounded-lg text-sm font-medium transition-colors"
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
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-arandano-500 focus:border-transparent mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredAvailableProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addProductToSale(product)}
                          className="w-full text-left px-3 py-2 bg-white hover:bg-arandano-50 border border-stone-200 rounded-lg transition-colors flex justify-between items-center"
                        >
                          <span className="text-sm font-medium text-arandano-950">{product.name}</span>
                          <span className="text-sm text-arandano-600 font-semibold">${formatPrice(product.price)}</span>
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
                        <div className="font-medium text-sm text-arandano-950">{item.productName}</div>
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
                          className="w-8 h-8 flex items-center justify-center bg-arandano-600 hover:bg-arandano-700 text-white rounded text-sm font-bold"
                        >
                          +
                        </button>
                        <span className="w-20 text-right font-semibold text-arandano-600">
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

              <div onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  💬 Comentario:
                </label>
                <textarea
                  value={editSaleComment}
                  onChange={(e) => setEditSaleComment(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Ej: Consumo propio, nota especial, etc."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[4.5rem]"
                  rows={3}
                  autoComplete="off"
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
                  <span className="font-semibold">Total:</span> <span className="text-lg font-bold text-arandano-600">${formatPrice(getEditTotal())}</span>
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
