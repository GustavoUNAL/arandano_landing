/**
 * Servicio de inventario (SQLite / PostgreSQL)
 */

import { dbAll, dbGet, dbRun } from './db'
import { InventoryItem } from './inventory'

function mapInventory(row: Record<string, unknown>): InventoryItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    quantity: row.quantity as number,
    initialQuantity: (row.initialQuantity as number) || undefined,
    unit: row.unit as string,
    productId: (row.productId as string) || undefined,
    capacity: (row.capacity as number) || undefined,
    capacityUnit: (row.capacityUnit as string) || undefined,
    currentCapacity: (row.currentCapacity as number) ?? (row.capacity as number) ?? undefined,
    currentCapacityUnit:
      (row.currentCapacityUnit as string) ?? (row.capacityUnit as string) ?? undefined,
    unitsPerPackage: (row.unitsPerPackage as number) || undefined,
    unitsPerPackageUnit: (row.unitsPerPackageUnit as string) || undefined,
    productType: (row.productType as string) || undefined,
    unitPrice: row.unitPrice as number,
    totalValue: row.totalValue as number,
    code: (row.code as string) || undefined,
    purchaseDate: (row.purchaseDate as string) || undefined,
    lot: (row.lot as string) || undefined,
    supplier: (row.supplier as string) || undefined,
    notes: (row.notes as string) || undefined,
  }
}

export async function getInventory(): Promise<InventoryItem[]> {
  const rows = await dbAll<Record<string, unknown>>('SELECT * FROM inventory ORDER BY name')
  return rows.map(mapInventory)
}

export async function createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
  const id = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()

  await dbRun(
    `INSERT INTO inventory (
      id, name, category, quantity, initialQuantity, unit, productId, capacity, capacityUnit,
      currentCapacity, currentCapacityUnit, unitsPerPackage, unitsPerPackageUnit, productType,
      unitPrice, totalValue, code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      item.name,
      item.category,
      item.quantity,
      item.initialQuantity || item.quantity || null,
      item.unit,
      item.productId || null,
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
      now,
    ]
  )

  const created = await getInventoryItemById(id)
  if (!created) throw new Error('Error creando item de inventario')
  return created
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | null> {
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM inventory WHERE id = ?', [id])
  if (!row) return null
  return mapInventory(row)
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<InventoryItem>
): Promise<InventoryItem | null> {
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`)
      values.push(value)
    }
  })

  if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
    const currentItem = await getInventoryItemById(id)
    if (currentItem) {
      const newQuantity =
        updates.quantity !== undefined ? updates.quantity : currentItem.quantity
      const newUnitPrice =
        updates.unitPrice !== undefined ? updates.unitPrice : currentItem.unitPrice
      const newTotalValue = newQuantity * newUnitPrice
      if (!fields.includes('totalValue = ?')) {
        fields.push('totalValue = ?')
        values.push(newTotalValue)
      }
    }
  }

  if (fields.length === 0) return getInventoryItemById(id)

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  await dbRun(`UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`, values)
  return getInventoryItemById(id)
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const result = await dbRun('DELETE FROM inventory WHERE id = ?', [id])
  return result.changes > 0
}
