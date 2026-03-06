'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import InventoryContent from './InventoryContent'

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number // Cantidad actual de productos
  initialQuantity?: number // Cantidad original comprada (productos)
  unit: string // Unidad de producto (Botella, Lata, etc.)
  /** ID del producto a la venta al que pertenece este ítem (stock enlazado) */
  productId?: string | null
  capacity?: number // Capacidad por unidad individual (ej: 750ml por botella)
  capacityUnit?: string // Unidad de capacidad (ml, cm3, litro, etc.)
  currentCapacity?: number // Capacidad actual por unidad (puede ser menor a la inicial)
  currentCapacityUnit?: string // Unidad de capacidad actual
  unitsPerPackage?: number // Cantidad de unidades individuales por paquete (ej: 6 botellas por paquete)
  unitsPerPackageUnit?: string // Unidad de las unidades individuales dentro del paquete (ej: Botella, Lata)
  productType?: ProductType // Tipo de producto según categoría específica
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
  'activos',
  'cigarrillos',
  'aseo',
  'comestibles',
  'bebidas alcoholicas',
  'insumos para cocteles',
  'insumos para cafeteria'
]

const CATEGORY_LABELS: Record<string, string> = {
  activos: 'Activos',
  cigarrillos: 'Cigarrillos',
  aseo: 'Aseo',
  comestibles: 'Comestibles',
  'bebidas alcoholicas': 'Bebidas alcohólicas',
  'insumos para cocteles': 'Insumos cocteles',
  'insumos para cafeteria': 'Insumos cafetería'
}

function computeByCategory(filteredItems: InventoryItem[]) {
  const categoryMap = new Map<string, { count: number; value: number }>()
  CATEGORIES.forEach((c) => categoryMap.set(c, { count: 0, value: 0 }))
  filteredItems.forEach((item) => {
    const cat = item.category || 'comestibles'
    if (!categoryMap.has(cat)) categoryMap.set(cat, { count: 0, value: 0 })
    const entry = categoryMap.get(cat)!
    entry.count += 1
    entry.value += item.totalValue || 0
  })

  return CATEGORIES.map((cat) => {
    const base = categoryMap.get(cat) || { count: 0, value: 0 }
    return {
      category: cat,
      label: CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
      ...base
    }
  }).filter((x) => x.count !== 0)
}

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

// Tipos de productos más específicos
const PRODUCT_TYPES = [
  { value: 'inventory-permanent', label: '📦 Inventario Permanente', description: 'Productos que se mantienen en stock (botellas de licor, equipos)', color: 'blue' },
  { value: 'food-edible', label: '🍽️ Productos Comestibles', description: 'Alimentos e ingredientes comestibles', color: 'green' },
  { value: 'disposables', label: '🥤 Desechables', description: 'Vasos, platos, servilletas, cubiertos desechables', color: 'orange' },
  { value: 'preparation-supplies', label: '☕ Insumos para Preparación', description: 'Café, siropes, bases, ingredientes para preparar bebidas', color: 'amber' },
  { value: 'cleaning-products', label: '🧹 Productos de Limpieza', description: 'Detergentes, desinfectantes, productos de aseo', color: 'purple' },
  { value: 'equipment-assets', label: '⚙️ Equipos y Activos', description: 'Equipos, maquinaria, activos fijos', color: 'indigo' },
  { value: 'packaged-beverages', label: '🍺 Bebidas Envasadas', description: 'Cervezas, vinos, refrescos envasados', color: 'yellow' },
  { value: 'accompaniments', label: '🥐 Acompañantes', description: 'Pan, galletas, snacks, acompañamientos', color: 'pink' },
  { value: 'other', label: '📋 Otros', description: 'Otros productos no categorizados', color: 'gray' }
] as const

export type ProductType = typeof PRODUCT_TYPES[number]['value']

// Función helper para obtener el tipo de producto
const getProductTypeInfo = (productType?: ProductType) => {
  return PRODUCT_TYPES.find(pt => pt.value === productType) || null
}

export default function InventoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLot, setFilterLot] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')
  const [filterProduct, setFilterProduct] = useState<string>('')
  const [filterProductType, setFilterProductType] = useState<ProductType[]>([])
  const [groupByProduct, setGroupByProduct] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'product' | 'lot' | 'date-lot'>('lot') // 'product', 'lot' o 'date-lot'
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set())
  const [lotProductTypeFilters, setLotProductTypeFilters] = useState<Map<string, ProductType[]>>(new Map())
  const [showLotProductTypeModal, setShowLotProductTypeModal] = useState<string | null>(null)
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
  const [categoryPopupCategory, setCategoryPopupCategory] = useState<string | null>(null)
  const [showLotModal, setShowLotModal] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showProductTypeModal, setShowProductTypeModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showCustomUnitInput, setShowCustomUnitInput] = useState(false)
  const [customUnit, setCustomUnit] = useState('')
  const [newItemForm, setNewItemForm] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    quantity: 0,
    unit: 'Unidad',
    productId: undefined,
    capacity: undefined,
    capacityUnit: undefined,
    currentCapacity: undefined,
    currentCapacityUnit: undefined,
    unitsPerPackage: undefined,
    unitsPerPackageUnit: undefined,
    productType: undefined,
    unitPrice: 0,
    code: '',
    supplier: '',
    lot: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const handleFilterProductTypeChange = (values: string[]) => {
    setFilterProductType(values as ProductType[])
  }
  const [productsForLink, setProductsForLink] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    loadInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.ok ? res.json() : [])
      .then((list: Array<{ id: string; name: string }>) => setProductsForLink(list))
      .catch(() => setProductsForLink([]))
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
      productId: item.productId ?? undefined,
      capacity: item.capacity,
      capacityUnit: item.capacityUnit,
      currentCapacity: item.currentCapacity ?? item.capacity,
      currentCapacityUnit: item.currentCapacityUnit ?? item.capacityUnit,
      unitsPerPackage: item.unitsPerPackage,
      unitsPerPackageUnit: item.unitsPerPackageUnit,
      productType: item.productType,
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
      if (lotEditForm.lot !== editingLot.lot) updates.lot = lotEditForm.lot.trim()
      if (lotEditForm.supplier !== editingLot.supplier) updates.supplier = lotEditForm.supplier || undefined
      if (lotEditForm.purchaseDate !== editingLot.purchaseDate) updates.purchaseDate = lotEditForm.purchaseDate || undefined

      if (Object.keys(updates).length === 0) {
        setEditingLot(null)
        setLotEditForm({ lot: '', supplier: '', purchaseDate: '' })
        setSaving(false)
        return
      }

      // Actualizar cada ítem del lote con la ruta /api/inventory/[id]
      const results = await Promise.all(
        editingLot.items.map(async (item) => {
          const res = await fetch(`/api/inventory/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          })
          return { id: item.id, ok: res.ok, error: res.ok ? null : await res.json().catch(() => ({})) }
        })
      )

      const failed = results.filter(r => !r.ok)
      if (failed.length > 0) {
        const msg = failed[0].error?.error || 'Error al actualizar lote'
        showAlert('error', msg)
        setSaving(false)
        return
      }

      await loadInventory()
      setEditingLot(null)
      setLotEditForm({ lot: '', supplier: '', purchaseDate: '' })
      showAlert('success', 'Lote actualizado exitosamente')
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
      const lotNameToDelete = deletingLot.lot.trim()

      // Eliminar cada ítem del lote con DELETE /api/inventory/[id]
      const results = await Promise.all(
        deletingLot.items.map(async (item) => {
          const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' })
          return { id: item.id, ok: res.ok, error: res.ok ? null : await res.json().catch(() => ({})) }
        })
      )

      const failed = results.filter(r => !r.ok)
      if (failed.length > 0) {
        const msg = failed[0].error?.error || 'Error al eliminar lote'
        showAlert('error', msg)
        setSaving(false)
        return
      }

      await loadInventory()
      setDeletingLot(null)
      setEditingLot(null)
      setLotEditForm({ lot: '', supplier: '', purchaseDate: '' })
      showAlert('success', `Lote "${lotNameToDelete}" eliminado exitosamente`)
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
    if (!newItemForm.name || !newItemForm.category || newItemForm.quantity === undefined || newItemForm.quantity === null || !newItemForm.unitPrice || !newItemForm.productType) {
      showAlert('error', 'Por favor completa todos los campos requeridos')
      return
    }
    
    // Validar unidades por paquete si la unidad es Paquete, Pack, Set o Cajetilla
    const isPackageUnit = newItemForm.unit === 'Paquete' || newItemForm.unit === 'Pack' || newItemForm.unit === 'Set' || newItemForm.unit === 'Cajetilla'
    if (isPackageUnit && (!newItemForm.unitsPerPackage || !newItemForm.unitsPerPackageUnit)) {
      showAlert('error', 'Por favor especifica la cantidad y unidad individual del paquete')
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
        currentCapacity: newItemForm.currentCapacity ?? newItemForm.capacity ?? undefined,
        currentCapacityUnit: newItemForm.currentCapacityUnit ?? newItemForm.capacityUnit ?? undefined,
        unitsPerPackage: newItemForm.unitsPerPackage || undefined,
        unitsPerPackageUnit: newItemForm.unitsPerPackageUnit || undefined,
        productType: newItemForm.productType,
        unitPrice,
        totalValue,
        code: newItemForm.code || undefined,
        supplier: newItemForm.supplier || undefined,
        lot: newItemForm.lot || undefined,
        purchaseDate: newItemForm.purchaseDate || new Date().toISOString().split('T')[0],
        notes: newItemForm.notes || undefined,
        productId: newItemForm.productId || undefined
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
          productId: undefined,
          capacity: undefined,
          capacityUnit: undefined,
          currentCapacity: undefined,
          currentCapacityUnit: undefined,
          unitsPerPackage: undefined,
          unitsPerPackageUnit: undefined,
          productType: undefined,
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
      productId: undefined,
      capacity: undefined,
      capacityUnit: undefined,
      currentCapacity: undefined,
      currentCapacityUnit: undefined,
      unitsPerPackage: undefined,
      unitsPerPackageUnit: undefined,
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
    // Filtro por tipo de producto: puede tener múltiples tipos seleccionados
    const matchesProductType = filterProductType.length === 0 || (item.productType && filterProductType.includes(item.productType))
    return matchesCategory && matchesSearch && matchesLot && matchesDate && matchesProduct && matchesProductType
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

  // Valor operativo: excluye activos y cigarrillos (control aparte)
  const totalValue = filteredItems
    .filter(item => item.category !== 'activos' && item.category !== 'cigarrillos')
    .reduce((sum, item) => sum + (item.totalValue || 0), 0)

  const totalAssetsValue = filteredItems
    .filter(item => item.category === 'activos')
    .reduce((sum, item) => sum + (item.totalValue || 0), 0)

  const totalRegulatedValue = filteredItems
    .filter(item => item.category === 'cigarrillos')
    .reduce((sum, item) => sum + (item.totalValue || 0), 0)

  const operationalItems = filteredItems.filter(item => item.category !== 'activos' && item.category !== 'cigarrillos')
  const assetsItems = filteredItems.filter(item => item.category === 'activos')
  const regulatedItems = filteredItems.filter(item => item.category === 'cigarrillos')

  // Desglose por categoría (count + value) para el resumen
  const byCategory = computeByCategory(filteredItems)

  return (
    <InventoryContent
      alert={alert}
      setAlert={setAlert}
      byCategory={byCategory}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      showAddModal={showAddModal}
      setShowAddModal={setShowAddModal}
      showConfigModal={showConfigModal}
      setShowConfigModal={setShowConfigModal}
      groupedByLot={groupedByLot}
      uniqueLots={uniqueLotsWithInfo}
      uniqueDates={uniqueDates}
      uniqueProducts={uniqueProducts}
      filterLot={filterLot}
      setFilterLot={setFilterLot}
      filterDate={filterDate}
      setFilterDate={setFilterDate}
      filterProduct={filterProduct}
      setFilterProduct={setFilterProduct}
      filterProductType={filterProductType}
      setFilterProductType={handleFilterProductTypeChange}
      productTypeOptions={PRODUCT_TYPES.map((pt) => ({ value: pt.value, label: pt.label }))}
      filteredItems={filteredItems}
      itemsWithLots={itemsWithLots}
      operationalItems={operationalItems}
      totalValue={totalValue}
      totalAssetsValue={totalAssetsValue}
      totalRegulatedValue={totalRegulatedValue}
    />
  )

}

