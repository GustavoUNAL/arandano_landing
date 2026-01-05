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


  const filteredItems = items.filter(item => {
    const matchesCategory = !filterCategory || item.category === filterCategory
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

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
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-berry-600 hover:text-berry-800 text-sm font-medium border border-berry-300 rounded-lg transition-colors"
            >
              ← Volver a Admin
            </button>
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

          {/* Resumen */}
          <div className="bg-berry-50 border border-berry-200 rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <div className="text-sm text-berry-700">
                  Total items operativos: <span className="font-bold">{operationalItems.length}</span>
                  {assetsItems.length > 0 && (
                    <span className="text-stone-500 ml-2">(+ {assetsItems.length} activos)</span>
                  )}
                  {regulatedItems.length > 0 && (
                    <span className="text-stone-500 ml-2">(+ {regulatedItems.length} regulados)</span>
                  )}
                </div>
                <div className="text-sm text-berry-700">Valor total inventario: <span className="font-bold">${totalValue.toLocaleString('es-CO')}</span></div>
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

