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
    unit: row.unit,
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
      id, name, category, quantity, unit, unitPrice, totalValue,
      code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    item.name,
    item.category,
    item.quantity,
    item.unit,
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
    unit: row.unit,
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
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })
  
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
