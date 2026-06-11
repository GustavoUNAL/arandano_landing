/**
 * Servicio de movimientos de stock (kardex)
 */

import { StockMovement } from './stock-movements'
import { dbAll, dbRun } from './db'
import { getDbMode } from './db-utils'

export type { StockMovement } from './stock-movements'

export async function createStockMovement(
  movement: Omit<StockMovement, 'id'>
): Promise<StockMovement> {
  if (getDbMode() === 'json') {
    throw new Error('Movimientos de stock solo están disponibles con base de datos relacional')
  }

  const newMovement: StockMovement = {
    ...movement,
    id: `movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }

  await dbRun(
    `INSERT INTO stock_movements (
      id, inventoryItemId, productId, type, quantity, unit,
      reason, notes, date, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newMovement.id,
      newMovement.inventoryItemId || null,
      newMovement.productId || null,
      newMovement.type,
      newMovement.quantity,
      newMovement.unit,
      newMovement.comment || null,
      null,
      newMovement.date || new Date().toISOString(),
      newMovement.createdAt || new Date().toISOString(),
    ]
  )

  return newMovement
}

function mapMovement(row: Record<string, unknown>): StockMovement {
  return {
    id: row.id as string,
    type: row.type as StockMovement['type'],
    productId: (row.productId as string) || undefined,
    inventoryItemId: (row.inventoryItemId as string) || undefined,
    quantity: row.quantity as number,
    unit: row.unit as string,
    date: (row.date as string) || (row.createdAt as string) || new Date().toISOString(),
    comment: (row.reason as string) || undefined,
    createdAt: (row.createdAt as string) || undefined,
  }
}

export async function getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
  if (getDbMode() === 'json') return []

  const rows = await dbAll<Record<string, unknown>>(
    `SELECT * FROM stock_movements 
    WHERE productId = ? 
    ORDER BY createdAt DESC`,
    [productId]
  )
  return rows.map(mapMovement)
}

export async function getStockMovementsByInventoryItem(
  inventoryItemId: string
): Promise<StockMovement[]> {
  if (getDbMode() === 'json') return []

  const rows = await dbAll<Record<string, unknown>>(
    `SELECT * FROM stock_movements 
    WHERE inventoryItemId = ? 
    ORDER BY createdAt DESC`,
    [inventoryItemId]
  )
  return rows.map(mapMovement)
}
