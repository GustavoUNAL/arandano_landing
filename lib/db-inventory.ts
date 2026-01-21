/**
 * Servicio de inventario usando SQLite
 * Mantiene compatibilidad con la interfaz existente
 */

import { InventoryItem } from './inventory'
import { getDbMode } from './db-utils'

// Re-exportar tipos
export type { InventoryItem } from './inventory'

// Importar funciones JSON (solo si DB_MODE === 'json')
import { getInventory as getInventoryJSON, saveInventory as saveInventoryJSON, createInventoryItem as createInventoryItemJSON, updateInventoryItem as updateInventoryItemJSON, deleteInventoryItem as deleteInventoryItemJSON } from './inventory'
// Importar funciones SQLite
import {
  getInventory as getInventorySQLite,
  createInventoryItem as createInventoryItemSQLite,
  updateInventoryItem as updateInventoryItemSQLite,
  deleteInventoryItem as deleteInventoryItemSQLite
} from './db-sqlite-inventory'

export async function getInventory(): Promise<InventoryItem[]> {
  const mode = getDbMode()
  
  if (mode === 'sqlite') {
    return getInventorySQLite()
  }
  
  if (mode === 'json') {
    return getInventoryJSON()
  }
  
  return getInventorySQLite()
}

export async function createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
  const mode = getDbMode()
  
  if (mode === 'sqlite') {
    return createInventoryItemSQLite(item)
  }
  
  if (mode === 'json') {
    return createInventoryItemJSON(item)
  }
  
  return createInventoryItemSQLite(item)
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
  const mode = getDbMode()
  
  if (mode === 'sqlite') {
    return updateInventoryItemSQLite(id, updates)
  }
  
  if (mode === 'json') {
    return updateInventoryItemJSON(id, updates)
  }
  
  return updateInventoryItemSQLite(id, updates)
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const mode = getDbMode()
  
  if (mode === 'sqlite') {
    return deleteInventoryItemSQLite(id)
  }
  
  if (mode === 'json') {
    return deleteInventoryItemJSON(id)
  }
  
  return deleteInventoryItemSQLite(id)
}
