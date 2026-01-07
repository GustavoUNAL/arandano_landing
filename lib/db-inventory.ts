/**
 * Servicio de inventario usando Firebase Firestore
 * Mantiene compatibilidad con la interfaz existente
 */

import admin from 'firebase-admin'
import { db } from './firebase-admin'
import { InventoryItem } from './inventory'
import { getDbMode, isDbAvailable } from './db-utils'

// Re-exportar tipos
export type { InventoryItem } from './inventory'

// Tipo helper para documentos de Firestore
type FirestoreInventoryItem = Omit<InventoryItem, 'id'>
type FirestoreDocument = admin.firestore.QueryDocumentSnapshot<FirestoreInventoryItem>
type FirestoreDocumentSnapshot = admin.firestore.DocumentSnapshot<FirestoreInventoryItem>

// Función helper para convertir documento a InventoryItem
function documentToInventoryItem(doc: FirestoreDocument | FirestoreDocumentSnapshot): InventoryItem {
  const data = doc.data()
  if (!data) {
    throw new Error('Document data is undefined')
  }
  return {
    id: doc.id,
    ...data
  }
}

// Importar funciones JSON (solo si DB_MODE === 'json')
import { getInventory as getInventoryJSON, saveInventory as saveInventoryJSON, createInventoryItem as createInventoryItemJSON, updateInventoryItem as updateInventoryItemJSON, deleteInventoryItem as deleteInventoryItemJSON } from './inventory'

export async function getInventory(): Promise<InventoryItem[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getInventoryJSON()
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }
  
  try {
    const snapshot = await db.collection('inventory').get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToInventoryItem(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo inventario de Firebase:', error)
    throw error
  }
}

export async function createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
  const mode = getDbMode()
  const newItem: InventoryItem = {
    ...item,
    id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  if (mode === 'json') {
    return createInventoryItemJSON(item)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('inventory').doc(newItem.id).set(newItem)
    return newItem
  } catch (error) {
    console.error('[DB] Error creando item de inventario en Firebase:', error)
    throw error
  }
}

export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return updateInventoryItemJSON(id, updates)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const docRef = db.collection('inventory').doc(id)
    await docRef.update(updates)
    
    const updated = await docRef.get() as FirestoreDocumentSnapshot
    if (!updated.exists) return null
    
    return documentToInventoryItem(updated)
  } catch (error) {
    console.error('[DB] Error actualizando item de inventario en Firebase:', error)
    throw error
  }
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return deleteInventoryItemJSON(id)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('inventory').doc(id).delete()
    return true
  } catch (error) {
    console.error('[DB] Error eliminando item de inventario de Firebase:', error)
    throw error
  }
}

