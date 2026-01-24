/**
 * Servicio de inventario usando SQLite
 */

import { getDatabase } from './db-sqlite'
import { InventoryItem } from './inventory'

export async function getInventory(): Promise<InventoryItem[]> {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM inventory ORDER BY name').all() as any[]
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    initialQuantity: row.initialQuantity || undefined,
    unit: row.unit,
    capacity: row.capacity || undefined,
    capacityUnit: row.capacityUnit || undefined,
    currentCapacity: row.currentCapacity ?? row.capacity ?? undefined,
    currentCapacityUnit: row.currentCapacityUnit ?? row.capacityUnit ?? undefined,
    unitsPerPackage: row.unitsPerPackage || undefined,
    unitsPerPackageUnit: row.unitsPerPackageUnit || undefined,
    productType: row.productType || undefined,
    unitPrice: row.unitPrice,
    totalValue: row.totalValue,
    code: row.code || undefined,
    purchaseDate: row.purchaseDate || undefined,
    lot: row.lot || undefined,
    supplier: row.supplier || undefined,
    notes: row.notes || undefined
  }))
}

export async function createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
  const db = getDatabase()
  const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  db.prepare(`
    INSERT INTO inventory (
      id, name, category, quantity, initialQuantity, unit, capacity, capacityUnit, currentCapacity, currentCapacityUnit, unitsPerPackage, unitsPerPackageUnit, productType, unitPrice, totalValue,
      code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    item.name,
    item.category,
    item.quantity,
    item.initialQuantity || item.quantity || null, // Si no se especifica, usar quantity como initialQuantity
    item.unit,
    item.capacity || null,
    item.capacityUnit || null,
    item.currentCapacity ?? item.capacity ?? null,
    item.currentCapacityUnit ?? item.capacityUnit ?? null,
    item.unitsPerPackage || null,
    item.unitsPerPackageUnit || null,
    item.productType || null,
    item.unitPrice,
    item.totalValue,
    item.code || null,
    item.purchaseDate || null,
    item.lot || null,
    item.supplier || null,
    item.notes || null,
    now,
    now
  )
  
  const created = await getInventoryItemById(id)
  if (!created) throw new Error('Error creando item de inventario')
  return created
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | null> {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id) as any
  
  if (!row) return null
  
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    initialQuantity: row.initialQuantity || undefined,
    unit: row.unit,
    capacity: row.capacity || undefined,
    capacityUnit: row.capacityUnit || undefined,
    currentCapacity: row.currentCapacity ?? row.capacity ?? undefined,
    currentCapacityUnit: row.currentCapacityUnit ?? row.capacityUnit ?? undefined,
    unitPrice: row.unitPrice,
    totalValue: row.totalValue,
    code: row.code || undefined,
    purchaseDate: row.purchaseDate || undefined,
    lot: row.lot || undefined,
    supplier: row.supplier || undefined,
    notes: row.notes || undefined
  }
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
  const db = getDatabase()
  const now = new Date().toISOString()
  
  const fields: string[] = []
  const values: any[] = []
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      // Si se actualiza quantity o initialQuantity, asegurarse de que totalValue se recalcule
      if (key === 'quantity' || key === 'unitPrice') {
        // No agregar totalValue aquí, se calculará después
      }
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })
  
  // Si se actualizó quantity o unitPrice, recalcular totalValue
  if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
    const currentItem = await getInventoryItemById(id)
    if (currentItem) {
      const newQuantity = updates.quantity !== undefined ? updates.quantity : currentItem.quantity
      const newUnitPrice = updates.unitPrice !== undefined ? updates.unitPrice : currentItem.unitPrice
      const newTotalValue = newQuantity * newUnitPrice
      
      // Evitar duplicados
      if (!fields.includes('totalValue = ?')) {
        fields.push('totalValue = ?')
        values.push(newTotalValue)
      } else {
        // Reemplazar el valor existente
        const index = fields.indexOf('totalValue = ?')
        values[index] = newTotalValue
      }
    }
  }
  
  // Agregar updatedAt siempre
  if (!fields.includes('updatedAt = ?')) {
    fields.push('updatedAt = ?')
    values.push(now)
  }
  
  if (fields.length === 0) {
    return await getInventoryItemById(id)
  }
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  db.prepare(`UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  
  return await getInventoryItemById(id)
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM inventory WHERE id = ?').run(id)
  return result.changes > 0
}
