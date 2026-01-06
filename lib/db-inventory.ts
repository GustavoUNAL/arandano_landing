/**
 * Servicio de inventario usando Firebase Firestore
 * Mantiene compatibilidad con la interfaz existente
 */

import { db } from './firebase-admin'
import { InventoryItem } from './inventory'
import { isDbAvailable } from './db-utils'

// Re-exportar tipos
export type { InventoryItem } from './inventory'

// Modo: 'firebase' | 'json' | 'hybrid'
const DB_MODE = (process.env.DB_MODE || 'firebase') as 'firebase' | 'json' | 'hybrid'

// Importar funciones JSON como fallback
import { getInventory as getInventoryJSON, saveInventory as saveInventoryJSON, createInventoryItem as createInventoryItemJSON, updateInventoryItem as updateInventoryItemJSON, deleteInventoryItem as deleteInventoryItemJSON } from './inventory'

export async function getInventory(): Promise<InventoryItem[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getInventoryJSON()
  }

  try {
    if (!isDbAvailable()) {
      return getInventoryJSON()
    }
    
    if (DB_MODE === 'firebase') {
      const snapshot = await db.collection('inventory').get()
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as InventoryItem))
    } else {
      try {
        const snapshot = await db.collection('inventory').get()
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as InventoryItem))
      } catch (error) {
        console.warn('Error leyendo de Firestore, usando JSON:', error)
        return getInventoryJSON()
      }
    }
  } catch (error) {
    console.error('Error obteniendo inventario:', error)
    return getInventoryJSON()
  }
}

export async function createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
  const newItem: InventoryItem = {
    ...item,
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  if (DB_MODE === 'json' || !isDbAvailable()) {
    return createInventoryItemJSON(item)
  }

  try {
    await db.collection('inventory').doc(newItem.id).set(newItem)
    
    if (DB_MODE === 'hybrid') {
      const items = getInventoryJSON()
      items.push(newItem)
      saveInventoryJSON(items)
    }
    
    return newItem
  } catch (error) {
    console.error('Error creando item de inventario:', error)
    return createInventoryItemJSON(item)
  }
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return updateInventoryItemJSON(id, updates)
  }

  try {
    const docRef = db.collection('inventory').doc(id)
    await docRef.update(updates)
    
    const updated = await docRef.get()
    if (!updated.exists) return null
    
    const updatedItem = { id: updated.id, ...updated.data() } as InventoryItem
    
    if (DB_MODE === 'hybrid') {
      const items = getInventoryJSON()
      const index = items.findIndex(item => item.id === id)
      if (index !== -1) {
        items[index] = updatedItem
        saveInventoryJSON(items)
      }
    }
    
    return updatedItem
  } catch (error) {
    console.error('Error actualizando item de inventario:', error)
    return updateInventoryItemJSON(id, updates)
  }
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return deleteInventoryItemJSON(id)
  }

  try {
    await db.collection('inventory').doc(id).delete()
    
    if (DB_MODE === 'hybrid') {
      const items = getInventoryJSON()
      const filtered = items.filter(item => item.id !== id)
      saveInventoryJSON(filtered)
    }
    
    return true
  } catch (error) {
    console.error('Error eliminando item de inventario:', error)
    return deleteInventoryItemJSON(id)
  }
}

