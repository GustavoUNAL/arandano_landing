/**
 * Servicio de movimientos de stock (kardex) usando SQLite
 */

import { StockMovement } from './stock-movements'
import { getDatabase } from './db-sqlite'
import { getDbMode } from './db-utils'

// Re-exportar tipos
export type { StockMovement } from './stock-movements'

export async function createStockMovement(movement: Omit<StockMovement, 'id'>): Promise<StockMovement> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    throw new Error('Movimientos de stock solo están disponibles en modo SQLite')
  }
  
  const db = getDatabase()
  const newMovement: StockMovement = {
    ...movement,
    id: `movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString()
  }

  db.prepare(`
    INSERT INTO stock_movements (
      id, inventoryItemId, productId, type, quantity, unit, 
      reason, notes, date, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newMovement.id,
    newMovement.inventoryItemId || null,
    newMovement.productId || null,
    newMovement.type,
    newMovement.quantity,
    newMovement.unit,
    newMovement.comment || null,
    null, // notes column
    newMovement.date || new Date().toISOString(),
    newMovement.createdAt || new Date().toISOString()
  )

  return newMovement
}

export async function getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return []
  }
  
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM stock_movements 
    WHERE productId = ? 
    ORDER BY createdAt DESC
  `).all(productId) as any[]

  return rows.map(row => ({
    id: row.id,
    type: row.type as StockMovement['type'],
    productId: row.productId || undefined,
    inventoryItemId: row.inventoryItemId || undefined,
    quantity: row.quantity,
    unit: row.unit,
    date: row.date || row.createdAt || new Date().toISOString(),
    comment: row.reason || undefined,
    createdAt: row.createdAt || undefined
  }))
}

export async function getStockMovementsByInventoryItem(inventoryItemId: string): Promise<StockMovement[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return []
  }
  
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT * FROM stock_movements 
    WHERE inventoryItemId = ? 
    ORDER BY createdAt DESC
  `).all(inventoryItemId) as any[]

  return rows.map(row => ({
    id: row.id,
    type: row.type as StockMovement['type'],
    productId: row.productId || undefined,
    inventoryItemId: row.inventoryItemId || undefined,
    quantity: row.quantity,
    unit: row.unit,
    date: row.date || row.createdAt || new Date().toISOString(),
    comment: row.reason || undefined,
    createdAt: row.createdAt || undefined
  }))
}
