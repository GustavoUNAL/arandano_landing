/**
 * Servicio de inventario (SQLite / PostgreSQL / JSON)
 */

import { InventoryItem } from './inventory'
import { getDbMode } from './db-utils'

export type { InventoryItem } from './inventory'

import {
  getInventory as getInventoryJSON,
  createInventoryItem as createInventoryItemJSON,
  updateInventoryItem as updateInventoryItemJSON,
  deleteInventoryItem as deleteInventoryItemJSON,
} from './inventory'
import {
  getInventory as getInventorySQLite,
  createInventoryItem as createInventoryItemSQLite,
  updateInventoryItem as updateInventoryItemSQLite,
  deleteInventoryItem as deleteInventoryItemSQLite,
} from './db-sqlite-inventory'

export async function getInventory(): Promise<InventoryItem[]> {
  if (getDbMode() === 'json') return getInventoryJSON()
  return getInventorySQLite()
}

export async function createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
  if (getDbMode() === 'json') return createInventoryItemJSON(item)
  return createInventoryItemSQLite(item)
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<InventoryItem>
): Promise<InventoryItem | null> {
  if (getDbMode() === 'json') return updateInventoryItemJSON(id, updates)
  return updateInventoryItemSQLite(id, updates)
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  if (getDbMode() === 'json') return deleteInventoryItemJSON(id)
  return deleteInventoryItemSQLite(id)
}
