/**
 * Servicio de movimientos de stock (kardex) usando Firebase Firestore
 */

import admin from 'firebase-admin'
import { db } from './firebase-admin'
import { StockMovement } from './stock-movements'
import { getDbMode, isDbAvailable } from './db-utils'

// Re-exportar tipos
export type { StockMovement } from './stock-movements'

// Tipo helper para documentos de Firestore
type FirestoreStockMovement = Omit<StockMovement, 'id'>
type FirestoreDocument = admin.firestore.QueryDocumentSnapshot<FirestoreStockMovement>
type FirestoreDocumentSnapshot = admin.firestore.DocumentSnapshot<FirestoreStockMovement>

// Función helper para convertir documento a StockMovement
function documentToStockMovement(doc: FirestoreDocument | FirestoreDocumentSnapshot): StockMovement {
  const data = doc.data()
  if (!data) {
    throw new Error('Document data is undefined')
  }
  return {
    id: doc.id,
    ...data
  }
}

export async function createStockMovement(movement: Omit<StockMovement, 'id'>): Promise<StockMovement> {
  const mode = getDbMode()
  
  const newMovement: StockMovement = {
    ...movement,
    id: `movement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString()
  }

  if (mode === 'json') {
    // JSON mode not implemented for stock movements - always use Firebase
    throw new Error('Movimientos de stock solo están disponibles en modo Firebase')
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('stockMovements').doc(newMovement.id).set(newMovement)
    return newMovement
  } catch (error) {
    console.error('[DB] Error creando movimiento de stock en Firebase:', error)
    throw error
  }
}

export async function getStockMovementsByProduct(productId: string): Promise<StockMovement[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return []
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const snapshot = await db.collection('stockMovements')
      .where('productId', '==', productId)
      .orderBy('date', 'desc')
      .get()
    
    return snapshot.docs.map((doc: FirestoreDocument) => documentToStockMovement(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo movimientos de stock por producto de Firebase:', error)
    throw error
  }
}

export async function getStockMovementsByInventoryItem(inventoryItemId: string): Promise<StockMovement[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return []
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const snapshot = await db.collection('stockMovements')
      .where('inventoryItemId', '==', inventoryItemId)
      .orderBy('date', 'desc')
      .get()
    
    return snapshot.docs.map((doc: FirestoreDocument) => documentToStockMovement(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo movimientos de stock por item de inventario de Firebase:', error)
    throw error
  }
}
