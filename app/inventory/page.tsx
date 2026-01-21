'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number // Cantidad actual de productos
  initialQuantity?: number // Cantidad original comprada (productos)
  unit: string // Unidad de producto (Botella, Lata, etc.)
  capacity?: number // Capacidad por unidad individual (ej: 750ml por botella)
  capacityUnit?: string // Unidad de capacidad (ml, cm3, litro, etc.)
  unitPrice: number
  totalValue: number
  code?: string
  purchaseDate?: string
  supplier?: string
  lot?: string
  notes?: string
}

interface StockInfo {
  consumedQuantity: number
  addedQuantity: number
  movements: any[]
}

interface GroupedByLot {
  lotId: string // ID único del lote
  lot: string
  supplier: string | null
  purchaseDate: string
  formattedDate: string
  items: InventoryItem[]
  totalQuantity: number
  totalValue: number
  categories: string[]
}

interface GroupedByDate {
  date: string
  formattedDate: string
  lots: GroupedByLot[]
  totalItems: number
  totalValue: number
  suppliers: string[]
}

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

const STANDARD_UNITS = [
  'Unidad',
  'Botella',
  'Lata',
  'Latón',
  'Gramo',
  'Kilogramo',
  'Libra',
  'ml',
  'Litro',
  'Paquete',
  'Cajetilla',
  'Frasco',
  'Bolsa',
  'Pack',
  'Set',
  'Rollo',
  'Otro'
]

const CAPACITY_UNITS = [
  'ml',
  'cm3',
  'Litro',
  'Gramo',
  'Kilogramo',
  'Onza',
  'Libra',
  'Otro'
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
  const [editingLot, setEditingLot] = useState<GroupedByLot | null>(null)
  const [lotEditForm, setLotEditForm] = useState<{ lot: string; supplier: string; purchaseDate: string }>({
    lot: '',
    supplier: '',
    purchaseDate: ''
  })
  const [deletingLot, setDeletingLot] = useState<GroupedByLot | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [stockInfo, setStockInfo] = useState<Record<string, StockInfo>>({})
  const [loadingStockInfo, setLoadingStockInfo] = useState<Record<string, boolean>>({})
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showCategoryModalInForm, setShowCategoryModalInForm] = useState(false)
  const [showLotModal, setShowLotModal] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false)
  const [customUnit, setCustomUnit] = useState('')
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

  const loadStockInfo = async (itemId: string) => {
    if (stockInfo[itemId] || loadingStockInfo[itemId]) return
    
    setLoadingStockInfo(prev => ({ ...prev, [itemId]: true }))
    try {
      const response = await fetch(`/api/inventory/${itemId}/stock`)
      if (response.ok) {
        const data = await response.json()
        setStockInfo(prev => ({ ...prev, [itemId]: data }))
      }
    } catch (error) {
      console.error('Error loading stock info:', error)
    } finally {
      setLoadingStockInfo(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    loadStockInfo(item.id) // Cargar información de stock al editar
    const unit = item.unit || 'Unidad'
    const isCustomUnit = !STANDARD_UNITS.includes(unit)
    setShowCustomUnitInput(isCustomUnit)
    if (isCustomUnit) {
      setCustomUnit(unit)
    }
    setEditForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      initialQuantity: item.initialQuantity || item.quantity,
      unit: unit,
      capacity: item.capacity,
      capacityUnit: item.capacityUnit,
      unitPrice: item.unitPrice,
      code: item.code || '',
      supplier: item.supplier || '',
      lot: item.lot || '',
      purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
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
        initialQuantity: editForm.initialQuantity !== undefined ? editForm.initialQuantity : quantity,
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
        setShowCustomUnitInput(false)
        setCustomUnit('')
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
    setShowCustomUnitInput(false)
    setCustomUnit('')
  }

  const handleEditLot = (lotGroup: GroupedByLot) => {
    setEditingLot(lotGroup)
    setLotEditForm({
      lot: lotGroup.lot,
      supplier: lotGroup.supplier || '',
      purchaseDate: lotGroup.purchaseDate !== 'sin-fecha' ? lotGroup.purchaseDate : ''
    })
  }

  const handleSaveLotEdit = async () => {
    if (!editingLot) return

    setSaving(true)
    try {
      const updates: Partial<InventoryItem> = {}
      
      // Si cambió el nombre del lote, actualizar lot
      if (lotEditForm.lot !== editingLot.lot) {
        updates.lot = lotEditForm.lot
      }
      
      // Si cambió el proveedor, actualizar supplier
      if (lotEditForm.supplier !== editingLot.supplier) {
        updates.supplier = lotEditForm.supplier || undefined
      }
      
      // Si cambió la fecha de compra, actualizar purchaseDate
      if (lotEditForm.purchaseDate !== editingLot.purchaseDate) {
        updates.purchaseDate = lotEditForm.purchaseDate || undefined
      }

      // Si no hay cambios, no hacer nada
      if (Object.keys(updates).length === 0) {
        setEditingLot(null)
        setLotEditForm({ lot: '', supplier: '', purchaseDate: '' })
        return
      }

      const response = await fetch('/api/inventory/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotName: editingLot.lot,
          updates
        })
      })

      if (response.ok) {
        await loadInventory()
        setEditingLot(null)
        setLotEditForm({ lot: '', supplier: '', purchaseDate: '' })
        showAlert('success', 'Lote actualizado exitosamente')
      } else {
        const errorData = await response.json()
        showAlert('error', errorData.error || 'Error al actualizar lote')
      }
    } catch (error) {
      console.error('Error updating lot:', error)
      showAlert('error', 'Error al actualizar lote')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelLotEdit = () => {
    setEditingLot(null)
    setLotEditForm({ lot: '', supplier: '', purchaseDate: '' })
  }

  const handleDeleteLot = (lotGroup: GroupedByLot) => {
    setDeletingLot(lotGroup)
  }

  const handleConfirmDeleteLot = async () => {
    if (!deletingLot) return

    setSaving(true)
    try {
      // Asegurar que el nombre del lote esté limpio
      const lotNameToDelete = deletingLot.lot.trim()
      
      console.log('Eliminando lote:', lotNameToDelete)
      console.log('Items en el lote:', deletingLot.items.map(i => ({ id: i.id, name: i.name, lot: i.lot })))
      
      const response = await fetch('/api/inventory/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lotName: lotNameToDelete
        })
      })

      const data = await response.json()

      if (response.ok) {
        await loadInventory()
        setDeletingLot(null)
        setEditingLot(null) // Cerrar también el modal de edición
        setLotEditForm({ lot: '', supplier: '', purchaseDate: '' })
        showAlert('success', `Lote "${lotNameToDelete}" eliminado exitosamente`)
      } else {
        console.error('Error response:', data)
        const errorMsg = data.error || 'Error al eliminar lote'
        const debugInfo = data.debug ? `\nLotes disponibles: ${data.debug.availableLots?.join(', ') || 'N/A'}` : ''
        showAlert('error', errorMsg + debugInfo)
      }
    } catch (error) {
      console.error('Error deleting lot:', error)
      showAlert('error', 'Error al eliminar lote')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelDeleteLot = () => {
    setDeletingLot(null)
  }

  const handleAddNewItem = async () => {
    // Validar campos requeridos
    if (!newItemForm.name || !newItemForm.category || newItemForm.quantity === undefined || newItemForm.quantity === null || !newItemForm.unitPrice) {
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
        initialQuantity: quantity,
        unit: newItemForm.unit || 'Unidad',
        capacity: newItemForm.capacity || undefined,
        capacityUnit: newItemForm.capacityUnit || undefined,
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
        setShowCustomUnitInput(false)
        setCustomUnit('')
        setNewItemForm({
          name: '',
          category: '',
          quantity: 0,
          unit: 'Unidad',
          capacity: undefined,
          capacityUnit: undefined,
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
    setShowCustomUnitInput(false)
    setCustomUnit('')
    setNewItemForm({
      name: '',
      category: '',
      quantity: 0,
      unit: 'Unidad',
      capacity: undefined,
      capacityUnit: undefined,
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
        // Generar ID único estable para el lote basado en el nombre del lote
        // Usar una función hash simple para generar un ID consistente
        const lotId = `lot-${lot.replace(/\s+/g, '-').toLowerCase().substring(0, 30)}-${Array.from(lot).reduce((acc, char) => acc + char.charCodeAt(0), 0)}`
        lotsMap.set(lotKey, {
          lotId: lotId,
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
        // Generar ID único estable para el lote basado en el nombre del lote
        const lotId = `lot-${lot.replace(/\s+/g, '-').toLowerCase().substring(0, 30)}-${Array.from(lot).reduce((acc, char) => acc + char.charCodeAt(0), 0)}`
        lotGroup = {
          lotId: lotId,
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

        {/* Header con título arriba, búsqueda y configuración abajo */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <a
              href="/admin"
              className="px-2 py-1.5 text-berry-600 hover:text-berry-800 text-base font-medium transition-colors"
            >
              ←
            </a>
            <h1 className="flex-1 text-center text-xl sm:text-2xl font-bold text-berry-950">Inventario Interno</h1>
            <div className="w-8"></div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-1 focus:ring-berry-500 focus:border-berry-500 transition-all bg-transparent"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-berry-600 hover:bg-berry-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              title="Agregar nuevo producto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Agregar</span>
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="p-2 text-berry-600 hover:text-berry-700 hover:bg-berry-50 rounded-lg transition-all flex items-center justify-center"
              title="Configuraciones"
            >
              <span className="text-xl">⚙️</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">

          {/* Resumen Mejorado */}
          <div className="bg-gradient-to-br from-berry-50 to-berry-100 border-2 border-berry-200 rounded-xl p-5 mb-4 shadow-sm">
            <div className="space-y-3">
              {/* Primera fila: Lotes e Items */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-berry-600 text-white rounded-lg px-3 py-1.5">
                    <span className="text-sm font-bold">{groupedByLot.length}</span>
                  </div>
                  <div>
                    <div className="text-xs text-stone-600 uppercase tracking-wide">Lotes registrados</div>
                    <div className="text-sm text-stone-700 font-medium">({filteredItems.length} items registrados)</div>
                  </div>
                </div>
              </div>

              {/* Segunda fila: Valor Total Inventario */}
              <div className="pt-2 border-t border-berry-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-berry-800">Valor total inventario</span>
                  <span className="text-lg font-bold text-berry-700">${totalValue.toLocaleString('es-CO')}</span>
                </div>
              </div>

              {/* Tercera fila: Activos y Regulados en grid */}
              {(assetsItems.length > 0 || regulatedItems.length > 0) && (filterCategory === 'activos' || filterCategory === 'productos regulados' || !filterCategory) && (
                <div className="pt-2 border-t border-berry-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assetsItems.length > 0 && (filterCategory === 'activos' || !filterCategory) && (
                    <div className="bg-white/60 rounded-lg p-3 border border-berry-200">
                      <div className="text-xs text-stone-600 mb-1">Valor activos</div>
                      <div className="text-base font-bold text-stone-700">${totalAssetsValue.toLocaleString('es-CO')}</div>
                      <div className="text-xs text-stone-500 mt-1">No incluido en inventario general</div>
                    </div>
                  )}
                  {regulatedItems.length > 0 && (filterCategory === 'productos regulados' || !filterCategory) && (
                    <div className="bg-white/60 rounded-lg p-3 border border-berry-200">
                      <div className="text-xs text-stone-600 mb-1">Valor productos regulados</div>
                      <div className="text-base font-bold text-stone-700">${totalRegulatedValue.toLocaleString('es-CO')}</div>
                      <div className="text-xs text-stone-500 mt-1">Control aparte - no incluido</div>
                    </div>
                  )}
                </div>
              )}

              {/* Filtros activos */}
              {(filterLot || filterDate) && (
                <div className="pt-2 border-t border-berry-200">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {filterLot && (
                      <span className="px-2 py-1 bg-berry-200 text-berry-800 rounded-full font-medium">
                        Lote: {filterLot}
                      </span>
                    )}
                    {filterDate && (
                      <span className="px-2 py-1 bg-berry-200 text-berry-800 rounded-full font-medium">
                        {new Date(filterDate + 'T00:00:00').toLocaleDateString('es-CO', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              )}
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
                    <div className="bg-berry-600 hover:bg-berry-700 transition-colors">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleLotExpansion(lotKey)}
                          className="flex-1 px-4 sm:px-6 py-4 text-white text-left"
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditLot(lotGroup)
                          }}
                          className="px-3 py-4 text-white hover:bg-berry-800 transition-colors"
                          title="Editar lote"
                        >
                          <span className="text-xl">⚙️</span>
                        </button>
                      </div>
                    </div>

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
                                    {item.capacity && item.capacityUnit && (
                                      <>
                                        <div className="text-xs text-stone-500 mt-1">
                                          {item.capacity} {item.capacityUnit}/unidad
                                        </div>
                                        <div className="text-xs font-semibold text-berry-600 mt-1">
                                          Total: {(item.quantity * item.capacity).toLocaleString('es-CO', { maximumFractionDigits: 0 })} {item.capacityUnit}
                                        </div>
                                      </>
                                    )}
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
                            <div className="bg-berry-100 hover:bg-berry-200 transition-colors">
                              <div className="flex items-center">
                                <button
                                  onClick={() => toggleLotExpansion(lotKey)}
                                  className="flex-1 px-4 py-3 text-berry-900 text-left"
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
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditLot(lotGroup)
                                  }}
                                  className="px-3 py-3 text-berry-900 hover:bg-berry-300 transition-colors"
                                  title="Editar lote"
                                >
                                  <span className="text-lg">⚙️</span>
                                </button>
                              </div>
                            </div>

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
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <h3 className="font-semibold text-base sm:text-lg text-berry-950">
                          {group.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-xs font-semibold">
                          {group.unit || group.items[0]?.unit || 'Unidad'}
                        </span>
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
                          {group.items[0]?.capacity && group.items[0]?.capacityUnit && (
                            <div className="text-xs text-stone-600 mt-1">
                              {group.items[0].capacity} {group.items[0].capacityUnit}/unidad
                              <span className="font-semibold text-berry-600 ml-1">
                                = {(group.totalQuantity * group.items[0].capacity).toLocaleString('es-CO', { maximumFractionDigits: 0 })} {group.items[0].capacityUnit} total
                              </span>
                            </div>
                          )}
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
                                    {group.items[0].capacity && group.items[0].capacityUnit && (
                                      <>
                                        <div className="text-xs text-stone-500 mt-1">
                                          {group.items[0].capacity} {group.items[0].capacityUnit}/unidad
                                        </div>
                                        <div className="text-xs font-semibold text-berry-600 mt-1">
                                          Total: {(group.items[0].quantity * group.items[0].capacity).toLocaleString('es-CO', { maximumFractionDigits: 0 })} {group.items[0].capacityUnit}
                                        </div>
                                      </>
                                    )}
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
                                          {item.capacity && item.capacityUnit && (
                                            <>
                                              <div className="text-xs text-stone-500 mt-1">
                                                {item.capacity} {item.capacityUnit}/unidad
                                              </div>
                                              <div className="text-xs font-semibold text-berry-600 mt-1">
                                                Total: {(item.quantity * item.capacity).toLocaleString('es-CO', { maximumFractionDigits: 0 })} {item.capacityUnit}
                                              </div>
                                            </>
                                          )}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base sm:text-lg text-berry-950">
                            {item.name}
                          </h3>
                          <span className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded text-xs font-semibold">
                            {item.unit}
                          </span>
                          <span className="px-2 py-1 bg-berry-100 text-berry-700 rounded text-xs font-medium">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
                        <div>
                          <span className="text-stone-600">Cantidad actual:</span>
                          <span className="font-semibold ml-1">{item.quantity} {item.unit}</span>
                          {item.capacity && item.capacityUnit && (
                            <div className="text-xs text-stone-500 mt-1">
                              {item.capacity} {item.capacityUnit}/unidad
                            </div>
                          )}
                          {item.capacity && item.capacityUnit && (
                            <div className="text-xs font-semibold text-berry-600 mt-1">
                              Total: {(item.quantity * item.capacity).toLocaleString('es-CO', { maximumFractionDigits: 0 })} {item.capacityUnit}
                            </div>
                          )}
                          {item.initialQuantity !== undefined && item.initialQuantity !== item.quantity && (
                            <div className="text-xs text-stone-500 mt-1">
                              <span className="text-stone-600">Comprado:</span> {item.initialQuantity} {item.unit}
                              {item.capacity && item.capacityUnit && (
                                <span className="ml-1">
                                  ({((item.initialQuantity || 0) * item.capacity).toLocaleString('es-CO', { maximumFractionDigits: 0 })} {item.capacityUnit} total)
                                </span>
                              )}
                            </div>
                          )}
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

      {/* Modal de Categorías */}
      {showCategoryModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCategoryModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-berry-950">Seleccionar Categoría</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-stone-500 hover:text-stone-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 mb-5">
              <button
                onClick={() => {
                  setFilterCategory('')
                  setShowCategoryModal(false)
                }}
                className={`w-full px-4 py-3.5 rounded-xl font-medium transition-all text-left text-base ${
                  !filterCategory
                    ? 'bg-berry-600 text-white shadow-md active:bg-berry-700'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border-2 border-stone-300'
                }`}
              >
                Todas las categorías
              </button>
              
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setFilterCategory(cat)
                    setShowCategoryModal(false)
                  }}
                  className={`w-full px-4 py-3.5 rounded-xl font-medium transition-all text-left text-base ${
                    filterCategory === cat
                      ? 'bg-berry-600 text-white shadow-md active:bg-berry-700'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border-2 border-stone-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowCategoryModal(false)}
              className="w-full px-4 py-3.5 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-semibold rounded-xl transition-colors text-base"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Lotes */}
      {showLotModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLotModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-berry-950">Seleccionar Lote</h2>
              <button
                onClick={() => setShowLotModal(false)}
                className="text-stone-500 hover:text-stone-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 mb-5">
              <button
                onClick={() => {
                  setFilterLot('')
                  setShowLotModal(false)
                }}
                className={`w-full px-4 py-3.5 rounded-xl font-medium transition-all text-left text-base ${
                  !filterLot
                    ? 'bg-berry-600 text-white shadow-md active:bg-berry-700'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border-2 border-stone-300'
                }`}
              >
                Todos los lotes
              </button>
              
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
                    <button
                      key={lotInfo.lot}
                      onClick={() => {
                        setFilterLot(lotInfo.lot)
                        setShowLotModal(false)
                      }}
                      className={`w-full px-4 py-3.5 rounded-xl font-medium transition-all text-left text-base ${
                        filterLot === lotInfo.lot
                          ? 'bg-berry-600 text-white shadow-md active:bg-berry-700'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border-2 border-stone-300'
                      }`}
                    >
                      {displayText}
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-4 text-stone-500">No hay lotes registrados</div>
              )}
            </div>
            
            <button
              onClick={() => setShowLotModal(false)}
              className="w-full px-4 py-3.5 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-semibold rounded-xl transition-colors text-base"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Fechas */}
      {showDateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDateModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-berry-950">Seleccionar Fecha</h2>
              <button
                onClick={() => setShowDateModal(false)}
                className="text-stone-500 hover:text-stone-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 mb-5">
              <button
                onClick={() => {
                  setFilterDate('')
                  setShowDateModal(false)
                }}
                className={`w-full px-4 py-3.5 rounded-xl font-medium transition-all text-left text-base ${
                  !filterDate
                    ? 'bg-berry-600 text-white shadow-md active:bg-berry-700'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border-2 border-stone-300'
                }`}
              >
                Todas las fechas
              </button>
              
              {uniqueDates.length > 0 ? (
                uniqueDates.map(date => {
                  const dateObj = new Date(date + 'T00:00:00')
                  const formattedDate = dateObj.toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                  return (
                    <button
                      key={date}
                      onClick={() => {
                        setFilterDate(date)
                        setShowDateModal(false)
                      }}
                      className={`w-full px-4 py-3.5 rounded-xl font-medium transition-all text-left text-base ${
                        filterDate === date
                          ? 'bg-berry-600 text-white shadow-md active:bg-berry-700'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border-2 border-stone-300'
                      }`}
                    >
                      {formattedDate}
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-4 text-stone-500">No hay fechas registradas</div>
              )}
            </div>
            
            <button
              onClick={() => setShowDateModal(false)}
              className="w-full px-4 py-3.5 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-semibold rounded-xl transition-colors text-base"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Productos */}
      {showProductModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProductModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-berry-950">Seleccionar Producto</h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-stone-500 hover:text-stone-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 mb-5">
              <button
                onClick={() => {
                  setFilterProduct('')
                  setShowProductModal(false)
                }}
                className={`w-full px-4 py-3.5 rounded-xl font-medium transition-all text-left text-base ${
                  !filterProduct
                    ? 'bg-berry-600 text-white shadow-md active:bg-berry-700'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border-2 border-stone-300'
                }`}
              >
                Todos los productos
              </button>
              
              {uniqueProducts.length > 0 ? (
                uniqueProducts.map((product) => {
                  const productKey = `${product.name.toLowerCase().trim()}_${product.unit.toLowerCase().trim()}`
                  return (
                    <button
                      key={productKey}
                      onClick={() => {
                        setFilterProduct(productKey)
                        setShowProductModal(false)
                      }}
                      className={`w-full px-4 py-3.5 rounded-xl font-medium transition-all text-left text-base ${
                        filterProduct === productKey
                          ? 'bg-berry-600 text-white shadow-md active:bg-berry-700'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border-2 border-stone-300'
                      }`}
                    >
                      {product.name} ({product.unit}) - {product.category}
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-4 text-stone-500">No hay productos registrados</div>
              )}
            </div>
            
            <button
              onClick={() => setShowProductModal(false)}
              className="w-full px-4 py-3.5 bg-stone-200 hover:bg-stone-300 active:bg-stone-400 text-stone-700 font-semibold rounded-xl transition-colors text-base"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

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
              {/* Agregar Nuevo Lote */}
              <button
                onClick={() => {
                  setShowConfigModal(false)
                  setShowAddModal(true)
                }}
                className="w-full px-3 py-2.5 rounded-lg font-semibold transition-all text-left bg-berry-600 text-white shadow-md hover:bg-berry-700 active:bg-berry-800 text-sm"
              >
                Agregar Nuevo Lote
              </button>

              {/* Configuración de Vista */}
              <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200">
                <div className="text-xs font-semibold text-stone-700 mb-2">Vista</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => {
                      setViewMode('lot')
                      setGroupByProduct(false)
                    }}
                    className={`px-2 py-2 rounded-md font-medium transition-all text-xs text-center ${
                      viewMode === 'lot' && !groupByProduct
                        ? 'bg-berry-600 text-white shadow-md'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-300'
                    }`}
                  >
                    Lotes
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('date-lot')
                      setGroupByProduct(false)
                    }}
                    className={`px-2 py-2 rounded-md font-medium transition-all text-xs text-center ${
                      viewMode === 'date-lot'
                        ? 'bg-berry-600 text-white shadow-md'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-300'
                    }`}
                  >
                    Fecha
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('product')
                      setGroupByProduct(true)
                    }}
                    className={`px-2 py-2 rounded-md font-medium transition-all text-xs text-center ${
                      viewMode === 'product' && groupByProduct
                        ? 'bg-berry-600 text-white shadow-md'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-300'
                    }`}
                  >
                    Producto
                  </button>
                </div>
              </div>

              {/* Filtros */}
              <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200">
                <div className="text-xs font-semibold text-stone-700 mb-2">Filtros</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Filtro Categoría */}
                  <button
                    onClick={() => {
                      setShowConfigModal(false)
                      setShowCategoryModal(true)
                    }}
                    className={`px-2 py-2 rounded-md font-medium transition-all text-xs text-center ${
                      filterCategory
                        ? 'bg-berry-600 text-white shadow-md'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-300'
                    }`}
                    title={filterCategory || 'Categoría'}
                  >
                    {filterCategory ? (filterCategory.length > 12 ? filterCategory.substring(0, 12) + '...' : filterCategory) : 'Categoría'}
                  </button>

                  {/* Filtro Lote */}
                  <button
                    onClick={() => {
                      setShowConfigModal(false)
                      setShowLotModal(true)
                    }}
                    disabled={items.length === 0}
                    className={`px-2 py-2 rounded-md font-medium transition-all text-xs text-center ${
                      filterLot
                        ? 'bg-berry-600 text-white shadow-md'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-300'
                    } ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={filterLot || 'Lote'}
                  >
                    {filterLot ? (filterLot.length > 12 ? filterLot.substring(0, 12) + '...' : filterLot) : 'Lote'}
                  </button>

                  {/* Filtro Fecha */}
                  <button
                    onClick={() => {
                      setShowConfigModal(false)
                      setShowDateModal(true)
                    }}
                    className={`px-2 py-2 rounded-md font-medium transition-all text-xs text-center ${
                      filterDate
                        ? 'bg-berry-600 text-white shadow-md'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-300'
                    }`}
                    title={filterDate ? new Date(filterDate + 'T00:00:00').toLocaleDateString('es-CO') : 'Fecha'}
                  >
                    {filterDate ? new Date(filterDate + 'T00:00:00').toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) : 'Fecha'}
                  </button>

                  {/* Filtro Producto */}
                  <button
                    onClick={() => {
                      setShowConfigModal(false)
                      setShowProductModal(true)
                    }}
                    disabled={items.length === 0}
                    className={`px-2 py-2 rounded-md font-medium transition-all text-xs text-center ${
                      filterProduct
                        ? 'bg-berry-600 text-white shadow-md'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-300'
                    } ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={filterProduct ? uniqueProducts.find(p => `${p.name.toLowerCase().trim()}_${p.unit.toLowerCase().trim()}` === filterProduct)?.name || 'Producto' : 'Producto'}
                  >
                    {filterProduct ? (() => {
                      const product = uniqueProducts.find(p => `${p.name.toLowerCase().trim()}_${p.unit.toLowerCase().trim()}` === filterProduct)
                      const name = product?.name || 'Producto'
                      return name.length > 12 ? name.substring(0, 12) + '...' : name
                    })() : 'Producto'}
                  </button>
                </div>
              </div>

              {/* Limpiar Filtros y Exportar en una fila */}
              <div className="grid grid-cols-2 gap-1.5">
                {(filterCategory || filterLot || filterDate || filterProduct || searchTerm) && (
                  <button
                    onClick={() => {
                      setFilterCategory('')
                      setFilterLot('')
                      setFilterDate('')
                      setFilterProduct('')
                      setSearchTerm('')
                      setShowConfigModal(false)
                      showAlert('success', 'Filtros limpiados')
                    }}
                    className="px-2 py-2 rounded-md font-medium transition-all text-xs text-center bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300 border border-red-300"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(items, null, 2)
                    const dataBlob = new Blob([dataStr], { type: 'application/json' })
                    const url = URL.createObjectURL(dataBlob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `inventario-${new Date().toISOString().split('T')[0]}.json`
                    link.click()
                    URL.revokeObjectURL(url)
                    setShowConfigModal(false)
                    showAlert('success', 'Inventario exportado exitosamente')
                  }}
                  className="px-2 py-2 rounded-md font-medium transition-all text-xs text-center bg-stone-100 text-stone-700 hover:bg-stone-200 active:bg-stone-300 border border-stone-300"
                >
                  Exportar
                </button>
              </div>

              {/* Estadísticas Rápidas - Compactas */}
              <div className="pt-2 border-t border-stone-200">
                <div className="text-xs font-semibold text-stone-700 mb-1.5">Estadísticas</div>
                <div className="grid grid-cols-2 gap-1.5 text-xs bg-stone-50 rounded-md p-2">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Items:</span>
                    <span className="font-semibold text-berry-700">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Filtrados:</span>
                    <span className="font-semibold text-berry-700">{filteredItems.length}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-stone-600">Valor:</span>
                    <span className="font-semibold text-berry-700">${totalValue.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-stone-600">Lotes:</span>
                    <span className="font-semibold text-berry-700">{groupedByLot.length}</span>
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

      {/* Modal de agregar nuevo lote */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-berry-950">Agregar Nuevo Lote</h2>
              <button
                onClick={handleCancelAdd}
                className="text-stone-500 hover:text-stone-700 text-2xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newItemForm.name || ''}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                  placeholder="Ej: Cerveza Poker 330ml"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Categoría *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModalInForm(true)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-berry-500 text-base text-left flex items-center justify-between ${
                      newItemForm.category
                        ? 'border-berry-500 bg-berry-50 text-berry-900'
                        : 'border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    <span>{newItemForm.category || 'Selecciona una categoría'}</span>
                    <span className="text-stone-400">▼</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Unidad *
                  </label>
                  <select
                    value={STANDARD_UNITS.includes(newItemForm.unit || 'Unidad') ? (newItemForm.unit || 'Unidad') : 'Otro'}
                    onChange={(e) => {
                      if (e.target.value === 'Otro') {
                        setShowCustomUnitInput(true)
                        setNewItemForm({ ...newItemForm, unit: customUnit || '' })
                      } else {
                        setShowCustomUnitInput(false)
                        setCustomUnit('')
                        setNewItemForm({ ...newItemForm, unit: e.target.value })
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all bg-white"
                    required
                  >
                    {STANDARD_UNITS.map(unit => (
                      <option key={unit} value={unit === 'Otro' ? 'Otro' : unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  {showCustomUnitInput && (
                    <input
                      type="text"
                      value={customUnit || newItemForm.unit || ''}
                      onChange={(e) => {
                        setCustomUnit(e.target.value)
                        setNewItemForm({ ...newItemForm, unit: e.target.value })
                      }}
                      className="w-full px-4 py-3 border-2 border-berry-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all mt-2"
                      placeholder="Ingresa la unidad personalizada"
                      required={showCustomUnitInput}
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Sección: Lo que se Compró */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-4 text-base">📦 Lo que se Compró</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Cantidad de Productos Comprados *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newItemForm.quantity !== undefined && newItemForm.quantity !== null ? newItemForm.quantity : ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        setNewItemForm({ ...newItemForm, quantity: isNaN(value) ? 0 : Math.max(0, value) })
                      }}
                      className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-stone-500 mt-1">Ej: 2 botellas, 3 latas, 5 unidades</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Capacidad por Unidad Individual (opcional)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={newItemForm.capacity !== undefined ? newItemForm.capacity : ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value)
                          setNewItemForm({ ...newItemForm, capacity: value !== undefined && !isNaN(value) ? Math.max(0, value) : undefined })
                        }}
                        className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                        placeholder="Ej: 750"
                      />
                      <select
                        value={newItemForm.capacityUnit || ''}
                        onChange={(e) => setNewItemForm({ ...newItemForm, capacityUnit: e.target.value || undefined })}
                        className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all bg-white"
                        disabled={!newItemForm.capacity || newItemForm.capacity === 0}
                      >
                        <option value="">Unidad</option>
                        {CAPACITY_UNITS.filter(u => u !== 'Otro').map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">Ej: 750 ml por botella, 330 ml por lata</p>
                  </div>
                </div>

                {/* Cálculo Total Comprado */}
                {newItemForm.capacity && newItemForm.capacityUnit && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-800">Total Comprado:</span>
                      <span className="text-lg font-bold text-blue-900">
                        {(newItemForm.quantity || 0) * (newItemForm.capacity || 0)} {newItemForm.capacityUnit}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      ({(newItemForm.quantity || 0)} productos × {newItemForm.capacity} {newItemForm.capacityUnit}/producto)
                    </p>
                  </div>
                )}
              </div>

              {/* Sección: Lo que Queda Actualmente */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-4 text-base">📊 Lo que Queda Actualmente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Cantidad de Productos Actuales *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newItemForm.quantity !== undefined && newItemForm.quantity !== null ? newItemForm.quantity : ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        setNewItemForm({ ...newItemForm, quantity: isNaN(value) ? 0 : Math.max(0, value) })
                      }}
                      className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-stone-500 mt-1">Ej: 1 botella, 2 latas, 3 unidades (inicialmente igual a comprado)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Capacidad por Unidad Individual
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={newItemForm.capacity !== undefined ? newItemForm.capacity : ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value)
                          setNewItemForm({ ...newItemForm, capacity: value !== undefined && !isNaN(value) ? Math.max(0, value) : undefined })
                        }}
                        className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                        placeholder="Ej: 750"
                      />
                      <select
                        value={newItemForm.capacityUnit || ''}
                        onChange={(e) => setNewItemForm({ ...newItemForm, capacityUnit: e.target.value || undefined })}
                        className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all bg-white"
                        disabled={!newItemForm.capacity || newItemForm.capacity === 0}
                      >
                        <option value="">Unidad</option>
                        {CAPACITY_UNITS.filter(u => u !== 'Otro').map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">Misma capacidad por unidad (se puede cambiar si es necesario)</p>
                  </div>
                </div>

                {/* Cálculo Total Actual */}
                {newItemForm.capacity && newItemForm.capacityUnit && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-800">Total Actual:</span>
                      <span className="text-lg font-bold text-green-900">
                        {(newItemForm.quantity || 0) * (newItemForm.capacity || 0)} {newItemForm.capacityUnit}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      ({(newItemForm.quantity || 0)} productos × {newItemForm.capacity} {newItemForm.capacityUnit}/producto)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Precio Unitario (COP) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={newItemForm.unitPrice || ''}
                  onChange={(e) => setNewItemForm({ ...newItemForm, unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  value={newItemForm.code || ''}
                  onChange={(e) => setNewItemForm({ ...newItemForm, code: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                  placeholder="Ej: CE-POK-001"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={newItemForm.supplier || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, supplier: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                    placeholder="Ej: Éxito, Patty"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={newItemForm.lot || ''}
                    onChange={(e) => setNewItemForm({ ...newItemForm, lot: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                    placeholder="Número de lote"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  value={newItemForm.purchaseDate || ''}
                  onChange={(e) => setNewItemForm({ ...newItemForm, purchaseDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={newItemForm.notes || ''}
                  onChange={(e) => setNewItemForm({ ...newItemForm, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
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
                className="flex-1 px-4 py-3.5 border-2 border-stone-300 rounded-xl hover:bg-stone-50 transition-colors font-semibold text-base"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNewItem}
                disabled={saving || !newItemForm.name || !newItemForm.category || newItemForm.quantity === undefined || newItemForm.quantity === null || !newItemForm.unitPrice || !newItemForm.unit}
                className="flex-1 px-4 py-3.5 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl"
              >
                {saving ? 'Guardando...' : 'Agregar Lote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Categorías dentro del formulario */}
      {showCategoryModalInForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowCategoryModalInForm(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-berry-950">Seleccionar Categoría</h2>
              <button
                onClick={() => setShowCategoryModalInForm(false)}
                className="text-stone-500 hover:text-stone-700 text-2xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    if (editingItem) {
                      setEditForm({ ...editForm, category: cat })
                    } else {
                      setNewItemForm({ ...newItemForm, category: cat })
                    }
                    setShowCategoryModalInForm(false)
                  }}
                  className={`w-full px-4 py-4 rounded-xl font-medium transition-all text-left ${
                    (editingItem ? editForm.category === cat : newItemForm.category === cat)
                      ? 'bg-berry-600 text-white shadow-md'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-2 border-stone-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowCategoryModalInForm(false)}
              className="w-full px-4 py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium rounded-xl transition-colors mt-4"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-berry-950">Editar Item de Inventario</h2>
              <button
                onClick={handleCancelEdit}
                className="text-stone-500 hover:text-stone-700 text-2xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                  required
                />
              </div>

              {/* Información de Stock */}
              {editingItem && stockInfo[editingItem.id] && (
                <div className="bg-stone-100 border-2 border-stone-300 rounded-lg p-4">
                  <h3 className="font-semibold text-stone-900 mb-3">📊 Resumen de Movimientos de Stock</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded p-2">
                      <span className="text-stone-600 text-xs">Comprado:</span>
                      <span className="font-bold ml-2 text-stone-900 block">
                        {editForm.initialQuantity !== undefined ? editForm.initialQuantity : editingItem.initialQuantity || editingItem.quantity} {editingItem.unit}
                      </span>
                      {editingItem.capacity && editingItem.capacityUnit && (
                        <span className="text-xs text-stone-500 mt-1 block">
                          = {((editForm.initialQuantity !== undefined ? editForm.initialQuantity : editingItem.initialQuantity || editingItem.quantity) * (editForm.capacity || editingItem.capacity)).toLocaleString('es-CO', { maximumFractionDigits: 0 })} {editForm.capacityUnit || editingItem.capacityUnit}
                        </span>
                      )}
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="text-stone-600 text-xs">Consumido:</span>
                      <span className="font-bold ml-2 text-red-600 block">
                        {stockInfo[editingItem.id].consumedQuantity.toFixed(2)} {editingItem.unit}
                      </span>
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="text-stone-600 text-xs">Agregado:</span>
                      <span className="font-bold ml-2 text-green-600 block">
                        {stockInfo[editingItem.id].addedQuantity.toFixed(2)} {editingItem.unit}
                      </span>
                    </div>
                    <div className="bg-white rounded p-2">
                      <span className="text-stone-600 text-xs">Actual:</span>
                      <span className="font-bold ml-2 text-berry-700 block">
                        {editForm.quantity !== undefined ? editForm.quantity : editingItem.quantity} {editingItem.unit}
                      </span>
                      {editingItem.capacity && editingItem.capacityUnit && (
                        <span className="text-xs text-stone-500 mt-1 block">
                          = {((editForm.quantity !== undefined ? editForm.quantity : editingItem.quantity) * (editForm.capacity || editingItem.capacity)).toLocaleString('es-CO', { maximumFractionDigits: 0 })} {editForm.capacityUnit || editingItem.capacityUnit}
                        </span>
                      )}
                    </div>
                  </div>
                  {stockInfo[editingItem.id].movements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-stone-300">
                      <p className="text-xs text-stone-600">
                        Total movimientos registrados: {stockInfo[editingItem.id].movements.length}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Categoría *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModalInForm(true)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-berry-500 text-base text-left flex items-center justify-between ${
                      editForm.category
                        ? 'border-berry-500 bg-berry-50 text-berry-900'
                        : 'border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    <span>{editForm.category || 'Selecciona una categoría'}</span>
                    <span className="text-stone-400">▼</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Unidad *
                  </label>
                  <select
                    value={STANDARD_UNITS.includes(editForm.unit || '') ? (editForm.unit || 'Unidad') : 'Otro'}
                    onChange={(e) => {
                      if (e.target.value === 'Otro') {
                        setShowCustomUnitInput(true)
                        setEditForm({ ...editForm, unit: customUnit || editForm.unit || '' })
                      } else {
                        setShowCustomUnitInput(false)
                        setCustomUnit('')
                        setEditForm({ ...editForm, unit: e.target.value })
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all bg-white"
                    required
                  >
                    {STANDARD_UNITS.map(unit => (
                      <option key={unit} value={unit === 'Otro' ? 'Otro' : unit}>
                        {unit === 'Otro' && editForm.unit && !STANDARD_UNITS.includes(editForm.unit) 
                          ? `Otra: ${editForm.unit}` 
                          : unit}
                      </option>
                    ))}
                  </select>
                  {showCustomUnitInput && (
                    <input
                      type="text"
                      value={customUnit || editForm.unit || ''}
                      onChange={(e) => {
                        setCustomUnit(e.target.value)
                        setEditForm({ ...editForm, unit: e.target.value })
                      }}
                      className="w-full px-4 py-3 border-2 border-berry-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all mt-2"
                      placeholder="Ingresa la unidad personalizada"
                      required={showCustomUnitInput}
                      autoFocus
                    />
                  )}
                </div>
              </div>

              {/* Sección: Lo que se Compró */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-4 text-base">📦 Lo que se Compró</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Cantidad de Productos Comprados *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editForm.initialQuantity !== undefined ? editForm.initialQuantity : editForm.quantity || ''}
                      onChange={(e) => setEditForm({ ...editForm, initialQuantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                      required
                    />
                    <p className="text-xs text-stone-500 mt-1">Ej: 2 botellas, 3 latas, 5 unidades</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Capacidad por Unidad Individual (opcional)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={editForm.capacity !== undefined ? editForm.capacity : ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value)
                          setEditForm({ ...editForm, capacity: value !== undefined && !isNaN(value) ? Math.max(0, value) : undefined })
                        }}
                        className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                        placeholder="Ej: 750"
                      />
                      <select
                        value={editForm.capacityUnit || ''}
                        onChange={(e) => setEditForm({ ...editForm, capacityUnit: e.target.value || undefined })}
                        className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all bg-white"
                        disabled={!editForm.capacity || editForm.capacity === 0}
                      >
                        <option value="">Unidad</option>
                        {CAPACITY_UNITS.filter(u => u !== 'Otro').map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">Ej: 750 ml por botella, 330 ml por lata</p>
                  </div>
                </div>
                
                {/* Cálculo Total Comprado */}
                {editForm.capacity && editForm.capacityUnit && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-blue-800">Total Comprado:</span>
                      <span className="text-lg font-bold text-blue-900">
                        {(editForm.initialQuantity !== undefined ? editForm.initialQuantity : editingItem?.initialQuantity || editingItem?.quantity || 0) * (editForm.capacity || 0)} {editForm.capacityUnit}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      ({editForm.initialQuantity !== undefined ? editForm.initialQuantity : editingItem?.initialQuantity || editingItem?.quantity || 0} productos × {editForm.capacity} {editForm.capacityUnit}/producto)
                    </p>
                  </div>
                )}
              </div>

              {/* Sección: Lo que Queda Actualmente */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-4 text-base">📊 Lo que Queda Actualmente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Cantidad de Productos Actuales *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={editForm.quantity !== undefined ? editForm.quantity : ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        setEditForm({ ...editForm, quantity: isNaN(value) ? 0 : Math.max(0, value) })
                      }}
                      className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                      required
                    />
                    <p className="text-xs text-stone-500 mt-1">Ej: 1 botella, 2 latas, 3 unidades</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Capacidad por Unidad Individual
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={editForm.capacity !== undefined ? editForm.capacity : ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value)
                          setEditForm({ ...editForm, capacity: value !== undefined && !isNaN(value) ? Math.max(0, value) : undefined })
                        }}
                        className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                        placeholder="Ej: 750"
                      />
                      <select
                        value={editForm.capacityUnit || ''}
                        onChange={(e) => setEditForm({ ...editForm, capacityUnit: e.target.value || undefined })}
                        className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all bg-white"
                        disabled={!editForm.capacity || editForm.capacity === 0}
                      >
                        <option value="">Unidad</option>
                        {CAPACITY_UNITS.filter(u => u !== 'Otro').map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">Misma capacidad por unidad (se puede cambiar si es necesario)</p>
                  </div>
                </div>

                {/* Cálculo Total Actual */}
                {editForm.capacity && editForm.capacityUnit && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-800">Total Actual:</span>
                      <span className="text-lg font-bold text-green-900">
                        {(editForm.quantity !== undefined ? editForm.quantity : editingItem?.quantity || 0) * (editForm.capacity || 0)} {editForm.capacityUnit}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      ({editForm.quantity !== undefined ? editForm.quantity : editingItem?.quantity || 0} productos × {editForm.capacity} {editForm.capacityUnit}/producto)
                    </p>
                  </div>
                )}
              </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.unitPrice || ''}
                    onChange={(e) => setEditForm({ ...editForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                    required
                  />
                </div>
              

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Código
                </label>
                <input
                  type="text"
                  value={editForm.code || ''}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={editForm.supplier || ''}
                    onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={editForm.lot || ''}
                    onChange={(e) => setEditForm({ ...editForm, lot: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  value={editForm.purchaseDate ? editForm.purchaseDate.split('T')[0] : ''}
                  onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
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

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-3.5 border-2 border-stone-300 rounded-xl hover:bg-stone-50 transition-colors font-semibold text-base"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editForm.name || !editForm.category || editForm.quantity === undefined || editForm.quantity === null || !editForm.unitPrice || !editForm.unit}
                className="flex-1 px-4 py-3.5 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de lote */}
      {deletingLot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-red-600">⚠️ Eliminar Lote</h2>
              <button
                onClick={handleCancelDeleteLot}
                className="text-stone-500 hover:text-stone-700 text-2xl leading-none"
                aria-label="Cerrar"
                disabled={saving}
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                <div className="text-red-800 font-semibold mb-2">
                  ⚠️ Esta acción no se puede deshacer
                </div>
                <div className="text-sm text-red-700">
                  Estás a punto de eliminar el lote <strong>"{deletingLot.lot}"</strong>
                </div>
              </div>
              
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-4">
                <div className="text-sm text-stone-700 space-y-2">
                  <div>
                    <strong>Productos afectados:</strong> {deletingLot.items.length} item(s)
                  </div>
                  <div>
                    <strong>Proveedor:</strong> {deletingLot.supplier || 'No especificado'}
                  </div>
                  <div>
                    <strong>Fecha de compra:</strong> {deletingLot.formattedDate}
                  </div>
                  <div>
                    <strong>Valor total:</strong> ${deletingLot.totalValue.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>

              <div className="text-sm text-stone-600">
                Todos los productos de este lote serán eliminados permanentemente del inventario.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancelDeleteLot}
                className="flex-1 px-4 py-3.5 border-2 border-stone-300 rounded-xl hover:bg-stone-50 transition-colors font-semibold text-base"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteLot}
                disabled={saving}
                className="flex-1 px-4 py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl"
              >
                {saving ? 'Eliminando...' : 'Sí, Eliminar Lote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de lote */}
      {editingLot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-berry-950">Editar Lote</h2>
              <button
                onClick={handleCancelLotEdit}
                className="text-stone-500 hover:text-stone-700 text-2xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-berry-50 border border-berry-200 rounded-lg">
              <div className="text-sm text-berry-700">
                <strong>Este lote contiene {editingLot.items.length} producto(s)</strong>
                <br />
                Los cambios se aplicarán a todos los productos de este lote.
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Nombre del Lote *
                </label>
                <input
                  type="text"
                  value={lotEditForm.lot}
                  onChange={(e) => setLotEditForm({ ...lotEditForm, lot: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={lotEditForm.supplier}
                  onChange={(e) => setLotEditForm({ ...lotEditForm, supplier: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  value={lotEditForm.purchaseDate}
                  onChange={(e) => setLotEditForm({ ...lotEditForm, purchaseDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-stone-300 rounded-xl focus:ring-2 focus:ring-berry-500 focus:border-berry-500 text-base transition-all"
                />
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4 mt-4">
              <div className="mb-4">
                <button
                  onClick={() => {
                    if (editingLot) {
                      const lotToDelete = editingLot
                      setEditingLot(null)
                      setLotEditForm({ lot: '', supplier: '', purchaseDate: '' })
                      handleDeleteLot(lotToDelete)
                    }
                  }}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-300 text-red-700 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar Lote
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleCancelLotEdit}
                className="flex-1 px-4 py-3.5 border-2 border-stone-300 rounded-xl hover:bg-stone-50 transition-colors font-semibold text-base"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLotEdit}
                disabled={saving || !lotEditForm.lot}
                className="flex-1 px-4 py-3.5 bg-berry-600 hover:bg-berry-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-lg hover:shadow-xl"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios del Lote'}
              </button>
            </div>
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
  )
}

