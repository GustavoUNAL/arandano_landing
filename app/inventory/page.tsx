'use client'

import { useState, useEffect, useMemo } from 'react'
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

const CATEGORIES = [
  'licores',
  'licores para shots',
  'siropes y bases',
  'productos de limpieza',
  'insumos para café',
  'desechables',
  'acompañantes',
  'activos',
  'productos regulados'
]

export default function InventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLot, setFilterLot] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')
  const [filterProduct, setFilterProduct] = useState<string>('')
  const [groupByProduct, setGroupByProduct] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'product' | 'lot' | 'date-lot'>('lot') // 'product', 'lot' o 'date-lot'
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set())
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({})
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItemForm, setNewItemForm] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    quantity: 0,
    unit: 'Unidad',
    unitPrice: 0,
    code: '',
    supplier: '',
    lot: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    loadInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setEditForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      code: item.code || '',
      supplier: item.supplier || '',
      lot: item.lot || '',
      purchaseDate: item.purchaseDate || '',
      notes: item.notes || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    setSaving(true)
    try {
      // Calcular totalValue basado en quantity y unitPrice
      const quantity = parseFloat(String(editForm.quantity || 0))
      const unitPrice = parseFloat(String(editForm.unitPrice || 0))
      const totalValue = quantity * unitPrice

      const updatedData = {
        ...editForm,
        quantity,
        unitPrice,
        totalValue
      }

      const response = await fetch(`/api/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        await loadInventory()
        setEditingItem(null)
        setEditForm({})
        showAlert('success', 'Item actualizado exitosamente')
      } else {
        showAlert('error', 'Error al actualizar item')
      }
    } catch (error) {
      console.error('Error updating item:', error)
      showAlert('error', 'Error al actualizar item')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setEditForm({})
  }

  const handleAddNewItem = async () => {
    // Validar campos requeridos
    if (!newItemForm.name || !newItemForm.category || !newItemForm.quantity || !newItemForm.unitPrice) {
      showAlert('error', 'Por favor completa todos los campos requeridos')
      return
    }

    setSaving(true)
    try {
      const quantity = parseFloat(String(newItemForm.quantity || 0))
      const unitPrice = parseFloat(String(newItemForm.unitPrice || 0))
      const totalValue = quantity * unitPrice

      const itemData = {
        name: newItemForm.name,
        category: newItemForm.category,
        quantity,
        unit: newItemForm.unit || 'Unidad',
        unitPrice,
        totalValue,
        code: newItemForm.code || undefined,
        supplier: newItemForm.supplier || undefined,
        lot: newItemForm.lot || undefined,
        purchaseDate: newItemForm.purchaseDate || new Date().toISOString().split('T')[0],
        notes: newItemForm.notes || undefined
      }

      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      })

      if (response.ok) {
        showAlert('success', 'Lote agregado exitosamente')
        setShowAddModal(false)
        setNewItemForm({
          name: '',
          category: '',
          quantity: 0,
          unit: 'Unidad',
          unitPrice: 0,
          code: '',
          supplier: '',
          lot: '',
          purchaseDate: new Date().toISOString().split('T')[0],
          notes: ''
        })
        loadInventory()
      } else {
        const error = await response.json()
        showAlert('error', error.error || 'Error al agregar lote')
      }
    } catch (error) {
      showAlert('error', 'Error al agregar lote')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelAdd = () => {
    setShowAddModal(false)
    setNewItemForm({
      name: '',
      category: '',
      quantity: 0,
      unit: 'Unidad',
      unitPrice: 0,
      code: '',
      supplier: '',
      lot: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
  }


  // Obtener lotes únicos con información detallada (proveedor y fecha)
  const uniqueLotsWithInfo = useMemo(() => {
    const lotsMap = new Map<string, { lot: string, supplier: string | null, purchaseDate: string | null, formattedDate: string }>()
    
    items.forEach(item => {
      // Verificar que el item tenga un lote válido
      if (!item.lot) return
      if (typeof item.lot !== 'string') return
      const trimmedLot = item.lot.trim()
      if (trimmedLot === '' || trimmedLot === 'sin-lote' || trimmedLot.toLowerCase() === 'n/a') return
      
      if (!lotsMap.has(trimmedLot)) {
        const purchaseDate = item.purchaseDate ? item.purchaseDate.split('T')[0] : null
        const dateObj = purchaseDate ? new Date(purchaseDate + 'T00:00:00') : null
        lotsMap.set(trimmedLot, {
          lot: trimmedLot,
          supplier: item.supplier || null,
          purchaseDate: purchaseDate,
          formattedDate: dateObj 
            ? dateObj.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : 'Sin fecha'
        })
      } else {
        // Si el proveedor no está definido, intentar usar el del item actual
        const existingLot = lotsMap.get(trimmedLot)!
        if (!existingLot.supplier && item.supplier) {
          existingLot.supplier = item.supplier
        }
        if (!existingLot.purchaseDate && item.purchaseDate) {
          const purchaseDate = item.purchaseDate.split('T')[0]
          existingLot.purchaseDate = purchaseDate
          const dateObj = new Date(purchaseDate + 'T00:00:00')
          existingLot.formattedDate = dateObj.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        }
      }
    })
    
    // Ordenar por fecha (más recientes primero), luego por nombre de lote
    return Array.from(lotsMap.values()).sort((a, b) => {
      if (a.purchaseDate && b.purchaseDate) {
        const dateCompare = b.purchaseDate.localeCompare(a.purchaseDate)
        if (dateCompare !== 0) return dateCompare
      }
      return a.lot.localeCompare(b.lot)
    })
  }, [items])

  // Lotes únicos simples (solo para compatibilidad)
  const uniqueLots = useMemo(() => {
    return uniqueLotsWithInfo.map(l => l.lot)
  }, [uniqueLotsWithInfo])

  // Contar items con lotes para información
  const itemsWithLots = useMemo(() => {
    return items.filter(item => {
      if (!item.lot) return false
      if (typeof item.lot !== 'string') return false
      const trimmedLot = item.lot.trim()
      return trimmedLot !== '' && trimmedLot !== 'sin-lote' && trimmedLot.toLowerCase() !== 'n/a'
    }).length
  }, [items])

  // Obtener fechas únicas y ordenadas (solo la parte de la fecha sin hora)
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(
      items
        .filter(item => item.purchaseDate && item.purchaseDate.trim() !== '')
        .map(item => {
          // Extraer solo la fecha sin la hora si existe
          const dateStr = item.purchaseDate!
          return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
        })
    )).sort().reverse() // Más recientes primero
  }, [items])

  // Obtener productos únicos (nombre + unidad) para el filtro
  const uniqueProducts = useMemo(() => {
    const productsMap = new Map<string, { name: string, unit: string, category: string }>()
    
    items.forEach(item => {
      const key = `${item.name.toLowerCase().trim()}_${item.unit.toLowerCase().trim()}`
      if (!productsMap.has(key)) {
        productsMap.set(key, {
          name: item.name,
          unit: item.unit,
          category: item.category
        })
      }
    })
    
    return Array.from(productsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
  }, [items])

  const filteredItems = items.filter(item => {
    const matchesCategory = !filterCategory || item.category === filterCategory
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesLot = !filterLot || item.lot === filterLot
    const matchesDate = !filterDate || (item.purchaseDate && item.purchaseDate.startsWith(filterDate))
    // Filtro por producto: comparar nombre y unidad
    const matchesProduct = !filterProduct || 
      (item.name.toLowerCase().trim() === filterProduct.split('_')[0] && 
       item.unit.toLowerCase().trim() === filterProduct.split('_')[1])
    return matchesCategory && matchesSearch && matchesLot && matchesDate && matchesProduct
  })

  // Agrupar productos por nombre y unidad para consolidar stock
  interface GroupedProduct {
    key: string
    name: string
    category: string
    unit: string
    totalQuantity: number
    items: InventoryItem[]
    totalValue: number
    codes: string[]
    suppliers: string[]
    lots: string[]
    purchaseDates: string[]
  }

  const groupedProducts = filteredItems.reduce((acc, item) => {
    // Crear una clave única por producto (nombre + unidad + categoría)
    const key = `${item.name.toLowerCase().trim()}_${item.unit.toLowerCase().trim()}_${item.category}`
    
    if (!acc[key]) {
      acc[key] = {
        key,
        name: item.name,
        category: item.category,
        unit: item.unit,
        totalQuantity: 0,
        items: [],
        totalValue: 0,
        codes: [],
        suppliers: [],
        lots: [],
        purchaseDates: []
      }
    }
    
    acc[key].totalQuantity += item.quantity
    acc[key].totalValue += item.totalValue
    acc[key].items.push(item)
    
    if (item.code && !acc[key].codes.includes(item.code)) {
      acc[key].codes.push(item.code)
    }
    if (item.supplier && !acc[key].suppliers.includes(item.supplier)) {
      acc[key].suppliers.push(item.supplier)
    }
    if (item.lot && !acc[key].lots.includes(item.lot)) {
      acc[key].lots.push(item.lot)
    }
    if (item.purchaseDate && !acc[key].purchaseDates.includes(item.purchaseDate)) {
      acc[key].purchaseDates.push(item.purchaseDate)
    }
    
    return acc
  }, {} as Record<string, GroupedProduct>)

  const groupedProductsArray = Object.values(groupedProducts).sort((a, b) => 
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  )

  // Agrupar directamente por LOTE (cada lote tiene su proveedor y fecha)
  interface GroupedByLot {
    lot: string
    supplier: string | null
    purchaseDate: string
    formattedDate: string
    items: InventoryItem[]
    totalQuantity: number
    totalValue: number
    categories: string[]
  }

  // Agrupar por lotes directamente - cada lote es único y tiene proveedor y fecha
  const groupedByLot = useMemo(() => {
    const lotsMap = new Map<string, GroupedByLot>()
    
    filteredItems.forEach(item => {
      const lot = item.lot && item.lot.trim() !== '' ? item.lot.trim() : 'sin-lote'
      const supplier = item.supplier || 'Sin proveedor'
      const purchaseDate = item.purchaseDate ? item.purchaseDate.split('T')[0] : 'sin-fecha'
      
      // Crear clave única para el lote (lote + fecha + proveedor para diferenciar)
      // Pero agrupamos por número de lote principalmente
      const lotKey = lot
      
      if (!lotsMap.has(lotKey)) {
        const dateObj = purchaseDate !== 'sin-fecha' ? new Date(purchaseDate + 'T00:00:00') : null
        lotsMap.set(lotKey, {
          lot: lot,
          supplier: supplier,
          purchaseDate: purchaseDate,
          formattedDate: dateObj 
            ? dateObj.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Sin fecha registrada',
          items: [],
          totalQuantity: 0,
          totalValue: 0,
          categories: []
        })
      }
      
      const lotGroup = lotsMap.get(lotKey)!
      lotGroup.items.push(item)
      lotGroup.totalQuantity += item.quantity
      lotGroup.totalValue += item.totalValue
      
      // Si el proveedor no está definido, intentar usar el del item
      if (lotGroup.supplier === 'Sin proveedor' && item.supplier) {
        lotGroup.supplier = item.supplier
      }
      
      // Si la fecha no está definida, intentar usar la del item
      if (lotGroup.purchaseDate === 'sin-fecha' && item.purchaseDate) {
        const itemDate = item.purchaseDate.split('T')[0]
        lotGroup.purchaseDate = itemDate
        const dateObj = new Date(itemDate + 'T00:00:00')
        lotGroup.formattedDate = dateObj.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
      
      if (!lotGroup.categories.includes(item.category)) {
        lotGroup.categories.push(item.category)
      }
    })
    
    // Convertir a array y ordenar por fecha (más recientes primero), luego por nombre de lote
    return Array.from(lotsMap.values()).sort((a, b) => {
      // Si tienen fecha, ordenar por fecha (más reciente primero)
      if (a.purchaseDate !== 'sin-fecha' && b.purchaseDate !== 'sin-fecha') {
        const dateCompare = b.purchaseDate.localeCompare(a.purchaseDate)
        if (dateCompare !== 0) return dateCompare
      }
      // Si tienen la misma fecha o no tienen fecha, ordenar por nombre de lote
      return a.lot.localeCompare(b.lot)
    })
  }, [filteredItems])

  // Agrupar por fecha de compra y luego por lote (vista alternativa)
  interface GroupedByDate {
    date: string
    formattedDate: string
    lots: GroupedByLot[]
    totalItems: number
    totalValue: number
    suppliers: string[]
  }

  // Agrupar por fecha de compra y luego por lote (vista alternativa)
  const groupedByDateAndLot = useMemo(() => {
    const dateMap = new Map<string, GroupedByDate>()
    
    filteredItems.forEach(item => {
      const purchaseDate = item.purchaseDate ? item.purchaseDate.split('T')[0] : 'sin-fecha'
      const lot = item.lot && item.lot.trim() !== '' ? item.lot.trim() : 'sin-lote'
      
      if (!dateMap.has(purchaseDate)) {
        const dateObj = purchaseDate !== 'sin-fecha' ? new Date(purchaseDate + 'T00:00:00') : null
        dateMap.set(purchaseDate, {
          date: purchaseDate,
          formattedDate: dateObj 
            ? dateObj.toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })
            : 'Sin fecha registrada',
          lots: [],
          totalItems: 0,
          totalValue: 0,
          suppliers: []
        })
      }
      
      const dateGroup = dateMap.get(purchaseDate)!
      let lotGroup = dateGroup.lots.find(l => l.lot === lot)
      
      if (!lotGroup) {
        lotGroup = {
          lot: lot,
          supplier: item.supplier || null,
          purchaseDate: purchaseDate,
          formattedDate: dateGroup.formattedDate,
          items: [],
          totalQuantity: 0,
          totalValue: 0,
          categories: []
        }
        dateGroup.lots.push(lotGroup)
      }
      
      lotGroup.items.push(item)
      lotGroup.totalQuantity += item.quantity
      lotGroup.totalValue += item.totalValue
      
      if (!lotGroup.categories.includes(item.category)) {
        lotGroup.categories.push(item.category)
      }
      
      if (!lotGroup.supplier && item.supplier) {
        lotGroup.supplier = item.supplier
      }
      
      if (item.supplier && !dateGroup.suppliers.includes(item.supplier)) {
        dateGroup.suppliers.push(item.supplier)
      }
      
      dateGroup.totalItems += 1
      dateGroup.totalValue += item.totalValue
    })
    
    // Convertir a array y ordenar por fecha (más recientes primero)
    const result = Array.from(dateMap.values()).sort((a, b) => {
      if (a.date === 'sin-fecha') return 1
      if (b.date === 'sin-fecha') return -1
      return b.date.localeCompare(a.date) // Más recientes primero
    })
    
    // Dentro de cada fecha, ordenar lotes por nombre
    result.forEach(dateGroup => {
      dateGroup.lots.sort((a, b) => a.lot.localeCompare(b.lot))
    })
    
    return result
  }, [filteredItems])

  const toggleProductExpansion = (key: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedProducts(newExpanded)
  }

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDates(newExpanded)
  }

  const toggleLotExpansion = (lotKey: string) => {
    const newExpanded = new Set(expandedLots)
    if (newExpanded.has(lotKey)) {
      newExpanded.delete(lotKey)
    } else {
      newExpanded.add(lotKey)
    }
    setExpandedLots(newExpanded)
  }

  // Calcular total excluyendo activos y productos regulados (no afectan el inventario operativo)
  const totalValue = filteredItems
    .filter(item => item.category !== 'activos' && item.category !== 'productos regulados')
    .reduce((sum, item) => sum + (item.totalValue || 0), 0)
  
  // Total de activos por separado (solo si están filtrados)
  const totalAssetsValue = filteredItems
    .filter(item => item.category === 'activos')
    .reduce((sum, item) => sum + (item.totalValue || 0), 0)
  
  // Total de productos regulados por separado
  const totalRegulatedValue = filteredItems
    .filter(item => item.category === 'productos regulados')
    .reduce((sum, item) => sum + (item.totalValue || 0), 0)
  
  // Items sin activos ni productos regulados para el conteo general
  const operationalItems = filteredItems.filter(item => item.category !== 'activos' && item.category !== 'productos regulados')
  const assetsItems = filteredItems.filter(item => item.category === 'activos')
  const regulatedItems = filteredItems.filter(item => item.category === 'productos regulados')

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

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-berry-950">📦 Inventario Interno</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-berry-600 hover:bg-berry-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Agregar Nuevo Lote
            </button>
            <a
              href="/admin"
              className="px-4 py-2 text-berry-600 hover:text-berry-800 text-sm font-medium"
            >
              ← Volver a Admin
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Categorías como botones */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
              <button
                onClick={() => setFilterCategory('')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  !filterCategory
                    ? 'bg-berry-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Todas
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                    filterCategory === cat
                      ? 'bg-berry-600 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Buscador */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 sm:py-2 text-base sm:text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
            />
          </div>

          {/* Filtros por Lote, Fecha y Producto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* Filtro por Lote */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                🏷️ Filtrar por Lote
              </label>
              <select
                value={filterLot}
                onChange={(e) => setFilterLot(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent bg-white"
                disabled={items.length === 0}
              >
                <option value="">
                  {items.length === 0 
                    ? 'Cargando...' 
                    : uniqueLotsWithInfo.length > 0 
                      ? `Todos los lotes (${uniqueLotsWithInfo.length} disponibles)` 
                      : 'Todos los lotes (sin lotes registrados)'}
                </option>
                {uniqueLotsWithInfo.length > 0 ? (
                  uniqueLotsWithInfo.map(lotInfo => {
                    const displayText = lotInfo.supplier && lotInfo.formattedDate !== 'Sin fecha'
                      ? `${lotInfo.lot} - ${lotInfo.supplier} (${lotInfo.formattedDate})`
                      : lotInfo.supplier
                      ? `${lotInfo.lot} - ${lotInfo.supplier}`
                      : lotInfo.formattedDate !== 'Sin fecha'
                      ? `${lotInfo.lot} (${lotInfo.formattedDate})`
                      : lotInfo.lot
                    return (
                      <option key={lotInfo.lot} value={lotInfo.lot}>{displayText}</option>
                    )
                  })
                ) : items.length > 0 ? (
                  <option disabled>No hay lotes registrados en el inventario</option>
                ) : null}
              </select>
              {filterLot && (
                <button
                  onClick={() => setFilterLot('')}
                  className="mt-1 text-xs text-berry-600 hover:text-berry-800 underline"
                >
                  Limpiar filtro de lote
                </button>
              )}
            </div>

            {/* Filtro por Fecha */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                📅 Filtrar por Fecha de Compra
              </label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent bg-white"
              >
                <option value="">Todas las fechas ({uniqueDates.length} disponibles)</option>
                {uniqueDates.length > 0 ? (
                  uniqueDates.map(date => {
                    const dateObj = new Date(date + 'T00:00:00')
                    const formattedDate = dateObj.toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                    return (
                      <option key={date} value={date}>{formattedDate}</option>
                    )
                  })
                ) : (
                  <option disabled>No hay fechas registradas</option>
                )}
              </select>
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="mt-1 text-xs text-berry-600 hover:text-berry-800 underline"
                >
                  Limpiar filtro de fecha
                </button>
              )}
            </div>

            {/* Filtro por Producto/Artículo */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                📦 Filtrar por Artículo/Producto
              </label>
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent bg-white"
                disabled={items.length === 0}
              >
                <option value="">
                  {items.length === 0 
                    ? 'Cargando...' 
                    : uniqueProducts.length > 0 
                      ? `Todos los productos (${uniqueProducts.length} disponibles)` 
                      : 'Todos los productos (sin productos registrados)'}
                </option>
                {uniqueProducts.length > 0 ? (
                  uniqueProducts.map((product, idx) => {
                    const productKey = `${product.name.toLowerCase().trim()}_${product.unit.toLowerCase().trim()}`
                    return (
                      <option key={productKey} value={productKey}>
                        {product.name} ({product.unit}) - {product.category}
                      </option>
                    )
                  })
                ) : items.length > 0 ? (
                  <option disabled>No hay productos registrados en el inventario</option>
                ) : null}
              </select>
              {filterProduct && (
                <button
                  onClick={() => setFilterProduct('')}
                  className="mt-1 text-xs text-berry-600 hover:text-berry-800 underline"
                >
                  Limpiar filtro de producto
                </button>
              )}
            </div>
          </div>

          {/* Indicadores de filtros activos */}
          {(filterLot || filterDate || filterProduct) && (
            <div className="mb-4 p-3 bg-berry-50 border border-berry-200 rounded-lg">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-berry-700">Filtros activos:</span>
                {filterLot && (
                  <span className="px-2 py-1 bg-berry-200 text-berry-800 rounded-full text-xs font-medium">
                    Lote: {filterLot}
                    <button
                      onClick={() => setFilterLot('')}
                      className="ml-2 hover:text-berry-900"
                      title="Remover filtro"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterDate && (
                  <span className="px-2 py-1 bg-berry-200 text-berry-800 rounded-full text-xs font-medium">
                    Fecha: {new Date(filterDate + 'T00:00:00').toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                    <button
                      onClick={() => setFilterDate('')}
                      className="ml-2 hover:text-berry-900"
                      title="Remover filtro"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filterProduct && (
                  <span className="px-2 py-1 bg-berry-200 text-berry-800 rounded-full text-xs font-medium">
                    Producto: {uniqueProducts.find(p => 
                      `${p.name.toLowerCase().trim()}_${p.unit.toLowerCase().trim()}` === filterProduct
                    )?.name || filterProduct}
                    <button
                      onClick={() => setFilterProduct('')}
                      className="ml-2 hover:text-berry-900"
                      title="Remover filtro"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilterLot('')
                    setFilterDate('')
                    setFilterProduct('')
                  }}
                  className="ml-auto text-xs text-berry-600 hover:text-berry-800 underline font-medium"
                >
                  Limpiar todos los filtros
                </button>
              </div>
            </div>
          )}

          {/* Toggle Vista */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-stone-700">Vista:</span>
              <button
                onClick={() => {
                  setViewMode('lot')
                  setGroupByProduct(false)
                }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  viewMode === 'lot' && !groupByProduct
                    ? 'bg-berry-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                📦 Por Lotes (Proveedor/Fecha)
              </button>
              <button
                onClick={() => {
                  setViewMode('date-lot')
                  setGroupByProduct(false)
                }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  viewMode === 'date-lot'
                    ? 'bg-berry-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                📅 Por Fecha y Lote
              </button>
              <button
                onClick={() => {
                  setViewMode('product')
                  setGroupByProduct(true)
                }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  viewMode === 'product' && groupByProduct
                    ? 'bg-berry-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                📊 Por Producto
              </button>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-berry-50 border border-berry-200 rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex-1">
                <div className="text-sm text-berry-700">
                  {filterLot || filterDate || filterCategory || searchTerm ? (
                    <>
                      {viewMode === 'lot' && !groupByProduct ? (
                        <>
                          Lotes registrados: <span className="font-bold">{groupedByLot.length}</span>
                          <span className="text-stone-500 ml-2">({filteredItems.length} items totales)</span>
                        </>
                      ) : viewMode === 'date-lot' ? (
                        <>
                          Fechas con compras: <span className="font-bold">{groupedByDateAndLot.length}</span>
                          <span className="text-stone-500 ml-2">({filteredItems.length} items totales)</span>
                        </>
                      ) : groupByProduct ? (
                        <>
                          Productos únicos: <span className="font-bold">{groupedProductsArray.length}</span>
                          <span className="text-stone-500 ml-2">({filteredItems.length} items totales)</span>
                        </>
                      ) : (
                        <>
                          Items filtrados: <span className="font-bold">{filteredItems.length}</span>
                          <span className="text-stone-500 ml-2">(de {items.length} total)</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {viewMode === 'lot' && !groupByProduct ? (
                        <>
                          Lotes registrados: <span className="font-bold">{groupedByLot.length}</span>
                          <span className="text-stone-500 ml-2">({filteredItems.length} items registrados)</span>
                        </>
                      ) : viewMode === 'date-lot' ? (
                        <>
                          Fechas con compras: <span className="font-bold">{groupedByDateAndLot.length}</span>
                          <span className="text-stone-500 ml-2">({filteredItems.length} items registrados)</span>
                        </>
                      ) : groupByProduct ? (
                        <>
                          Productos únicos: <span className="font-bold">{groupedProductsArray.length}</span>
                          <span className="text-stone-500 ml-2">({filteredItems.length} items registrados)</span>
                        </>
                      ) : (
                        <>
                          Total items operativos: <span className="font-bold">{operationalItems.length}</span>
                          {assetsItems.length > 0 && (
                            <span className="text-stone-500 ml-2">(+ {assetsItems.length} activos)</span>
                          )}
                          {regulatedItems.length > 0 && (
                            <span className="text-stone-500 ml-2">(+ {regulatedItems.length} regulados)</span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
                <div className="text-sm text-berry-700">
                  Valor total inventario: <span className="font-bold">${totalValue.toLocaleString('es-CO')}</span>
                </div>
                {assetsItems.length > 0 && (filterCategory === 'activos' || !filterCategory) && (
                  <div className="text-sm text-stone-500 mt-1">
                    Valor activos: <span className="font-semibold">${totalAssetsValue.toLocaleString('es-CO')}</span>
                    <span className="text-xs ml-2">(no incluido en inventario general)</span>
                  </div>
                )}
                {regulatedItems.length > 0 && (filterCategory === 'productos regulados' || !filterCategory) && (
                  <div className="text-sm text-stone-500 mt-1">
                    Valor productos regulados: <span className="font-semibold">${totalRegulatedValue.toLocaleString('es-CO')}</span>
                    <span className="text-xs ml-2">(control aparte - no incluido en inventario general)</span>
                  </div>
                )}
                {filterLot && (
                  <div className="text-xs text-stone-600 mt-2 pt-2 border-t border-berry-200">
                    📦 Mostrando items del lote: <span className="font-semibold">{filterLot}</span>
                  </div>
                )}
                {filterDate && (
                  <div className="text-xs text-stone-600 mt-1">
                    📅 Mostrando items comprados el: <span className="font-semibold">
                      {new Date(filterDate + 'T00:00:00').toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
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
          ) : viewMode === 'lot' && !groupByProduct ? (
            /* Vista por Lotes - Organización directa por lote con proveedor y fecha */
            <div className="space-y-4">
              {groupedByLot.map((lotGroup) => {
                const lotKey = `${lotGroup.lot}-${lotGroup.purchaseDate}`
                return (
                  <div
                    key={lotKey}
                    className="bg-stone-50 border-2 border-stone-200 rounded-lg overflow-hidden hover:border-berry-300 transition-colors"
                  >
                    {/* Encabezado del Lote */}
                    <button
                      onClick={() => toggleLotExpansion(lotKey)}
                      className="w-full px-4 sm:px-6 py-4 bg-berry-600 hover:bg-berry-700 text-white text-left transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h2 className="text-lg sm:text-xl font-bold">
                              🏷️ {lotGroup.lot}
                            </h2>
                            {lotGroup.supplier && lotGroup.supplier !== 'Sin proveedor' && (
                              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                🏪 {lotGroup.supplier}
                              </span>
                            )}
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                              📅 {lotGroup.formattedDate}
                            </span>
                          </div>
                          <div className="text-sm text-berry-100 flex flex-wrap gap-3 sm:gap-4">
                            <span>{lotGroup.items.length} producto(s)</span>
                            <span>Stock total: {lotGroup.totalQuantity} unidades</span>
                            <span className="font-semibold">Valor: ${lotGroup.totalValue.toLocaleString('es-CO')}</span>
                            {lotGroup.categories.length > 0 && (
                              <span>{lotGroup.categories.length} categoría(s)</span>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl ml-3">
                          {expandedLots.has(lotKey) ? '▼' : '▶'}
                        </div>
                      </div>
                    </button>

                    {/* Productos dentro del lote */}
                    {expandedLots.has(lotKey) && (
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-berry-50 rounded-lg border border-berry-200">
                          <div>
                            <span className="text-sm font-semibold text-berry-800">Proveedor:</span>
                            <span className="text-sm text-berry-700 ml-2">{lotGroup.supplier || 'No especificado'}</span>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-berry-800">Fecha de compra:</span>
                            <span className="text-sm text-berry-700 ml-2">{lotGroup.formattedDate}</span>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-berry-800">Categorías:</span>
                            <span className="text-sm text-berry-700 ml-2">{lotGroup.categories.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-berry-800">Valor total del lote:</span>
                            <span className="text-sm font-bold text-berry-700 ml-2">${lotGroup.totalValue.toLocaleString('es-CO')}</span>
                          </div>
                        </div>
                        
                        <div className="text-sm font-semibold text-stone-700 mb-3">
                          📋 Productos en este lote ({lotGroup.items.length}):
                        </div>
                        
                        {lotGroup.items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-lg p-4 border border-stone-200 hover:border-berry-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-sm sm:text-base text-berry-950">
                                    {item.name}
                                  </h4>
                                  <span className="px-2 py-1 bg-berry-50 text-berry-700 rounded text-xs font-medium">
                                    {item.category}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                                  <div>
                                    <span className="text-stone-600">Cantidad:</span>
                                    <span className="font-semibold ml-1 block">{item.quantity} {item.unit}</span>
                                  </div>
                                  <div>
                                    <span className="text-stone-600">Precio unit:</span>
                                    <span className="font-semibold ml-1 block">${item.unitPrice.toLocaleString('es-CO')}</span>
                                  </div>
                                  <div>
                                    <span className="text-stone-600">Subtotal:</span>
                                    <span className="font-semibold ml-1 block text-berry-700">${item.totalValue.toLocaleString('es-CO')}</span>
                                  </div>
                                  {item.code && (
                                    <div>
                                      <span className="text-stone-600">Código:</span>
                                      <span className="font-semibold ml-1 block">{item.code}</span>
                                    </div>
                                  )}
                                </div>
                                {item.notes && (
                                  <div className="mt-2 text-xs text-stone-600 italic pt-2 border-t border-stone-200">
                                    📝 {item.notes}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1 sm:p-2 text-stone-500 hover:text-berry-600 hover:bg-berry-50 rounded-lg transition-colors"
                                title="Editar producto"
                              >
                                <span className="text-base sm:text-lg">⚙️</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : viewMode === 'date-lot' ? (
            /* Vista por Fecha y Lote */
            <div className="space-y-4">
              {groupedByDateAndLot.map((dateGroup) => (
                <div
                  key={dateGroup.date}
                  className="bg-stone-50 border-2 border-stone-200 rounded-lg overflow-hidden"
                >
                  {/* Encabezado de Fecha */}
                  <button
                    onClick={() => toggleDateExpansion(dateGroup.date)}
                    className="w-full px-4 sm:px-6 py-4 bg-berry-600 hover:bg-berry-700 text-white text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold mb-1">
                          📅 {dateGroup.formattedDate}
                        </h2>
                        <div className="text-sm text-berry-100 flex flex-wrap gap-4">
                          <span>{dateGroup.lots.length} lote(s)</span>
                          <span>{dateGroup.totalItems} item(s)</span>
                          <span>Total: ${dateGroup.totalValue.toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                      <div className="text-2xl">
                        {expandedDates.has(dateGroup.date) ? '▼' : '▶'}
                      </div>
                    </div>
                  </button>

                  {/* Lotes dentro de esta fecha */}
                  {expandedDates.has(dateGroup.date) && (
                    <div className="p-4 space-y-3">
                      {dateGroup.lots.map((lotGroup, lotIdx) => {
                        const lotKey = `${dateGroup.date}-${lotGroup.lot}`
                        return (
                          <div
                            key={lotKey}
                            className="bg-white border-2 border-stone-300 rounded-lg overflow-hidden"
                          >
                            {/* Encabezado del Lote */}
                            <button
                              onClick={() => toggleLotExpansion(lotKey)}
                              className="w-full px-4 py-3 bg-berry-100 hover:bg-berry-200 text-berry-900 text-left transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-base sm:text-lg">
                                      🏷️ Lote: {lotGroup.lot}
                                    </h3>
                                    {lotGroup.supplier && (
                                      <span className="px-2 py-1 bg-white border border-berry-300 rounded-full text-xs font-medium">
                                        Proveedor: {lotGroup.supplier}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs sm:text-sm text-berry-700 flex flex-wrap gap-3">
                                    <span>{lotGroup.items.length} producto(s)</span>
                                    <span>Stock total: {lotGroup.totalQuantity} unidades</span>
                                    <span className="font-semibold">Valor: ${lotGroup.totalValue.toLocaleString('es-CO')}</span>
                                  </div>
                                </div>
                                <div className="text-xl ml-2">
                                  {expandedLots.has(lotKey) ? '▼' : '▶'}
                                </div>
                              </div>
                            </button>

                            {/* Productos dentro del lote */}
                            {expandedLots.has(lotKey) && (
                              <div className="p-4 space-y-2">
                                {lotGroup.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="bg-stone-50 rounded-lg p-3 border border-stone-200 hover:border-berry-300 transition-colors"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <h4 className="font-semibold text-sm sm:text-base text-berry-950">
                                            {item.name}
                                          </h4>
                                          <span className="px-2 py-1 bg-berry-50 text-berry-700 rounded text-xs font-medium">
                                            {item.category}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                                          <div>
                                            <span className="text-stone-600">Cantidad:</span>
                                            <span className="font-semibold ml-1 block">{item.quantity} {item.unit}</span>
                                          </div>
                                          <div>
                                            <span className="text-stone-600">Precio unit:</span>
                                            <span className="font-semibold ml-1 block">${item.unitPrice.toLocaleString('es-CO')}</span>
                                          </div>
                                          <div>
                                            <span className="text-stone-600">Subtotal:</span>
                                            <span className="font-semibold ml-1 block text-berry-700">${item.totalValue.toLocaleString('es-CO')}</span>
                                          </div>
                                          {item.code && (
                                            <div>
                                              <span className="text-stone-600">Código:</span>
                                              <span className="font-semibold ml-1 block">{item.code}</span>
                                            </div>
                                          )}
                                        </div>
                                        {item.notes && (
                                          <div className="mt-2 text-xs text-stone-600 italic pt-2 border-t border-stone-200">
                                            📝 {item.notes}
                                          </div>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => handleEdit(item)}
                                        className="p-1 sm:p-2 text-stone-500 hover:text-berry-600 hover:bg-berry-50 rounded-lg transition-colors"
                                        title="Editar producto"
                                      >
                                        <span className="text-base sm:text-lg">⚙️</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : groupByProduct ? (
            /* Vista Agrupada por Producto */
            <div className="space-y-3">
              {groupedProductsArray.map((group) => (
                <div
                  key={group.key}
                  className="bg-stone-50 border-2 border-stone-200 rounded-lg p-4 sm:p-5 hover:border-berry-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-base sm:text-lg text-berry-950">
                          {group.name}
                        </h3>
                        <span className="px-2 py-1 bg-berry-100 text-berry-700 rounded text-xs font-medium">
                          {group.category}
                        </span>
                      </div>
                      
                      {/* Información consolidada */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm mb-3">
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-stone-600">Stock Total:</span>
                          <span className="font-bold ml-1 text-berry-700 text-base">
                            {group.totalQuantity} {group.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-600">Valor Total:</span>
                          <span className="font-semibold ml-1 text-berry-700">
                            ${group.totalValue.toLocaleString('es-CO')}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-600">Lotes:</span>
                          <span className="font-semibold ml-1">{group.lots.length}</span>
                        </div>
                        <div>
                          <span className="text-stone-600">Proveedores:</span>
                          <span className="font-semibold ml-1">{group.suppliers.length}</span>
                        </div>
                      </div>

                      {/* Información de Lotes y Proveedores - Siempre visible */}
                      <div className="mt-3 pt-3 border-t border-stone-300">
                          <div className="bg-berry-50 rounded-lg p-3 mb-3">
                            <div className="space-y-2">
                              {group.lots.length > 0 && (
                                <div>
                                  <span className="text-sm font-semibold text-berry-800 mb-2 block">
                                    🏷️ Lotes registrados ({group.lots.length}):
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {group.lots.map((lot) => (
                                      <span
                                        key={lot}
                                        className="px-3 py-1 bg-white border border-berry-300 rounded-full text-sm font-medium text-berry-700"
                                      >
                                        {lot}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {group.suppliers.length > 0 && (
                                <div className="pt-2 border-t border-berry-200">
                                  <span className="text-sm font-semibold text-berry-800 mb-2 block">
                                    🏪 Proveedores ({group.suppliers.length}):
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {group.suppliers.map((supplier) => (
                                      <span
                                        key={supplier}
                                        className="px-3 py-1 bg-white border border-berry-300 rounded-full text-sm text-stone-700"
                                      >
                                        {supplier}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Botón para expandir/colapsar lotes individuales */}
                          {group.items.length > 1 && (
                            <button
                              onClick={() => toggleProductExpansion(group.key)}
                              className="w-full px-4 py-2 bg-berry-100 hover:bg-berry-200 text-berry-700 font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                            >
                              <span>{expandedProducts.has(group.key) ? '▼' : '▶'}</span>
                              <span>
                                {expandedProducts.has(group.key) 
                                  ? ' Ocultar detalle de lotes individuales' 
                                  : ` Ver detalle de ${group.items.length} lote(s) individual(es)`
                                }
                              </span>
                            </button>
                          )}

                          {/* Si solo hay un item, mostrar su información de lote directamente */}
                          {group.items.length === 1 && group.items[0].lot && (
                            <div className="mt-3 bg-white rounded-lg p-3 border border-stone-200">
                              <div className="text-sm text-stone-700">
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                  <div>
                                    <span className="text-stone-600">Cantidad del lote:</span>
                                    <span className="font-semibold ml-1 block">{group.items[0].quantity} {group.items[0].unit}</span>
                                  </div>
                                  <div>
                                    <span className="text-stone-600">Precio unitario:</span>
                                    <span className="font-semibold ml-1 block">${group.items[0].unitPrice.toLocaleString('es-CO')}</span>
                                  </div>
                                  {group.items[0].code && (
                                    <div>
                                      <span className="text-stone-600">Código:</span>
                                      <span className="font-semibold ml-1 block">{group.items[0].code}</span>
                                    </div>
                                  )}
                                  {group.items[0].purchaseDate && (
                                    <div>
                                      <span className="text-stone-600">Fecha de compra:</span>
                                      <span className="font-semibold ml-1 block">
                                        {new Date(group.items[0].purchaseDate).toLocaleDateString('es-CO', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Detalle de lotes individuales (expandible cuando hay más de uno) */}
                          {expandedProducts.has(group.key) && group.items.length > 1 && (
                            <div className="mt-3 space-y-3">
                              <div className="text-sm font-semibold text-stone-700 mb-2">
                                📋 Detalle de lotes individuales:
                              </div>
                              {group.items.map((item, idx) => (
                                <div key={item.id} className="bg-white rounded-lg p-4 border-2 border-stone-200 hover:border-berry-300 transition-colors">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      {item.lot && (
                                        <div className="mb-2">
                                          <span className="px-3 py-1 bg-berry-100 text-berry-700 rounded-full text-sm font-semibold">
                                            🏷️ Lote: {item.lot}
                                          </span>
                                        </div>
                                      )}
                                      <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                                        <div>
                                          <span className="text-stone-600">Cantidad:</span>
                                          <span className="font-semibold ml-1 block text-base">{item.quantity} {item.unit}</span>
                                        </div>
                                        <div>
                                          <span className="text-stone-600">Precio unit:</span>
                                          <span className="font-semibold ml-1 block">${item.unitPrice.toLocaleString('es-CO')}</span>
                                        </div>
                                        <div>
                                          <span className="text-stone-600">Subtotal del lote:</span>
                                          <span className="font-semibold ml-1 block text-berry-700">${item.totalValue.toLocaleString('es-CO')}</span>
                                        </div>
                                        {item.code && (
                                          <div>
                                            <span className="text-stone-600">Código:</span>
                                            <span className="font-semibold ml-1 block">{item.code}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-3 text-xs text-stone-500 mt-2 pt-2 border-t border-stone-200">
                                        {item.supplier && (
                                          <span className="flex items-center gap-1">
                                            <span className="font-medium">Proveedor:</span> {item.supplier}
                                          </span>
                                        )}
                                        {item.purchaseDate && (
                                          <span className="flex items-center gap-1">
                                            <span className="font-medium">Compra:</span> {new Date(item.purchaseDate).toLocaleDateString('es-CO', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </span>
                                        )}
                                      </div>
                                      {item.notes && (
                                        <div className="mt-2 text-xs text-stone-600 italic pt-2 border-t border-stone-200">
                                          📝 {item.notes}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="p-2 text-stone-500 hover:text-berry-600 hover:bg-berry-50 rounded-lg transition-colors"
                                      title="Editar este lote"
                                    >
                                      <span className="text-lg">⚙️</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Si no hay lotes ni proveedores, mostrar información del item único si existe */}
                          {group.lots.length === 0 && group.suppliers.length === 0 && group.items.length === 1 && (
                            <div className="bg-stone-50 rounded-lg p-3">
                              <div className="text-sm text-stone-600">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="text-stone-600">Precio unitario:</span>
                                    <span className="font-semibold ml-1 block">${group.items[0].unitPrice.toLocaleString('es-CO')}</span>
                                  </div>
                                  {group.items[0].purchaseDate && (
                                    <div>
                                      <span className="text-stone-600">Fecha de compra:</span>
                                      <span className="font-semibold ml-1 block">
                                        {new Date(group.items[0].purchaseDate).toLocaleDateString('es-CO', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {group.items[0].notes && (
                                  <div className="mt-2 text-xs text-stone-500 italic pt-2 border-t border-stone-200">
                                    📝 {group.items[0].notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                    
                    {/* Botón de edición rápida (edita el primer item) */}
                    {group.items.length === 1 && (
                      <button
                        onClick={() => handleEdit(group.items[0])}
                        className="p-2 text-stone-600 hover:text-berry-600 transition-colors self-start"
                        title="Editar"
                        aria-label="Editar producto"
                      >
                        <span className="text-xl">⚙️</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Vista por Lotes Individuales (original) */
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-stone-50 border-2 border-stone-200 rounded-lg p-4 sm:p-5 hover:border-berry-300 transition-colors relative"
                >
                  <button
                    onClick={() => handleEdit(item)}
                    className="absolute top-3 right-3 p-1 text-stone-600 hover:text-berry-600 transition-colors"
                    title="Editar"
                    aria-label="Editar item"
                  >
                    <span className="text-xl">⚙️</span>
                  </button>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1 pr-8">
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

      {/* Modal de agregar nuevo lote */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-berry-950 mb-4">Agregar Nuevo Lote</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newItemForm.name || ''}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Ej: Cerveza Poker 330ml"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={newItemForm.category || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Unidad *
                  </label>
                  <input
                    type="text"
                    value={newItemForm.unit || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Ej: Lata, Botella, Unidad, Libra"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newItemForm.quantity || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Precio Unitario (COP) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newItemForm.unitPrice || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  value={newItemForm.code || ''}
                  onChange={(e) => setNewItemForm({ ...newItemForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Ej: CE-POK-001"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={newItemForm.supplier || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Ej: Éxito, Patty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={newItemForm.lot || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, lot: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Número de lote"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  value={newItemForm.purchaseDate || ''}
                  onChange={(e) => setNewItemForm({ ...newItemForm, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={newItemForm.notes || ''}
                  onChange={(e) => setNewItemForm({ ...newItemForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent text-sm sm:text-base"
                  rows={3}
                  placeholder="Observaciones adicionales sobre este lote"
                />
              </div>

              {newItemForm.quantity && newItemForm.unitPrice && (
                <div className="bg-berry-50 border border-berry-200 rounded-lg p-3">
                  <div className="text-sm text-berry-700">
                    Valor total calculado: <span className="font-bold text-base">
                      ${((parseFloat(String(newItemForm.quantity)) || 0) * (parseFloat(String(newItemForm.unitPrice)) || 0)).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleCancelAdd}
                className="flex-1 px-4 py-2 border-2 border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-medium text-sm sm:text-base"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNewItem}
                disabled={saving || !newItemForm.name || !newItemForm.category || !newItemForm.quantity || !newItemForm.unitPrice || !newItemForm.unit}
                className="flex-1 px-4 py-3 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {saving ? 'Guardando...' : 'Agregar Lote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-berry-950 mb-4">Editar Item de Inventario</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Unidad *
                  </label>
                  <input
                    type="text"
                    value={editForm.unit || ''}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                    placeholder="Ej: Lata, Botella, Unidad"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.quantity || ''}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.unitPrice || ''}
                    onChange={(e) => setEditForm({ ...editForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={editForm.code || ''}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={editForm.supplier || ''}
                    onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={editForm.lot || ''}
                    onChange={(e) => setEditForm({ ...editForm, lot: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  value={editForm.purchaseDate ? editForm.purchaseDate.split('T')[0] : ''}
                  onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-berry-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              {editForm.quantity && editForm.unitPrice && (
                <div className="bg-berry-50 border border-berry-200 rounded-lg p-3">
                  <div className="text-sm text-berry-700">
                    Valor total calculado: <span className="font-bold">
                      ${((parseFloat(String(editForm.quantity)) || 0) * (parseFloat(String(editForm.unitPrice)) || 0)).toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 border-2 border-stone-300 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editForm.name || !editForm.category || !editForm.quantity || !editForm.unitPrice || !editForm.unit}
                className="flex-1 px-4 py-3 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

