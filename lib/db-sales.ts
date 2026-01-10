/**
 * Servicio de ventas usando Firebase Firestore
 * Mantiene compatibilidad con la interfaz existente
 */

import admin from 'firebase-admin'
import { db } from './firebase-admin'
import { Sale } from './sales'
import { getDbMode, isDbAvailable } from './db-utils'

// Re-exportar tipos
export type { Sale } from './sales'

// Tipo helper para convertir documentos de Firestore a Sale
type FirestoreSale = Omit<Sale, 'id'>
type FirestoreDocument = admin.firestore.QueryDocumentSnapshot<FirestoreSale>
type FirestoreDocumentSnapshot = admin.firestore.DocumentSnapshot<FirestoreSale>

// Función helper para convertir documento de Firestore a Sale
function documentToSale(doc: FirestoreDocument | FirestoreDocumentSnapshot): Sale {
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
import { getSales as getSalesJSON, saveSales as saveSalesJSON, getSalesByDateRange as getSalesByDateRangeJSON, getSalesByProduct as getSalesByProductJSON, getSaleById as getSaleByIdJSON, deleteSale as deleteSaleJSON, createSale as createSaleJSON, updateSale as updateSaleJSON } from './sales'

export async function getSales(): Promise<Sale[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getSalesJSON()
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }
  
  try {
    const snapshot = await db.collection('sales').orderBy('date', 'desc').get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToSale(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo ventas de Firebase:', error)
    throw error
  }
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getSaleByIdJSON(id)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const docRef = db.collection('sales').doc(id)
    const docSnap = await docRef.get() as FirestoreDocumentSnapshot
    
    if (docSnap.exists) {
      return documentToSale(docSnap)
    }
    return undefined
  } catch (error) {
    console.error('[DB] Error obteniendo venta de Firebase:', error)
    throw error
  }
}

export async function createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
  const mode = getDbMode()
  const newSale: Sale = {
    ...sale,
    id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  if (mode === 'json') {
    return createSaleJSON(sale)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('sales').doc(newSale.id).set(newSale)
    return newSale
  } catch (error) {
    console.error('[DB] Error creando venta en Firebase:', error)
    throw error
  }
}

export async function updateSale(id: string, updates: Partial<Sale>): Promise<Sale | null> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return updateSaleJSON(id, updates)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const docRef = db.collection('sales').doc(id)
    const docSnap = await docRef.get() as FirestoreDocumentSnapshot
    
    if (!docSnap.exists) {
      return null
    }
    
    await docRef.update(updates)
    
    const updated = await docRef.get() as FirestoreDocumentSnapshot
    if (!updated.exists) return null
    
    return documentToSale(updated)
  } catch (error) {
    console.error('[DB] Error actualizando venta de Firebase:', error)
    throw error
  }
}

export async function deleteSale(id: string): Promise<boolean> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return deleteSaleJSON(id)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('sales').doc(id).delete()
    return true
  } catch (error) {
    console.error('[DB] Error eliminando venta de Firebase:', error)
    throw error
  }
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getSalesByDateRangeJSON(startDate, endDate)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const snapshot = await db.collection('sales')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToSale(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo ventas por rango de Firebase:', error)
    throw error
  }
}

export async function getSalesByProduct(productId: string): Promise<Sale[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getSalesByProductJSON(productId)
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const snapshot = await db.collection('sales')
      .where('items', 'array-contains-any', [{ productId }])
      .orderBy('date', 'desc')
      .get()
    
    // Filtrar en memoria porque Firestore no soporta búsqueda anidada directamente
    const allSales: Sale[] = snapshot.docs.map((doc: FirestoreDocument) => documentToSale(doc))
    return allSales.filter((sale: Sale) => 
      sale.items.some((item) => item.productId === productId)
    )
  } catch (error) {
    console.error('[DB] Error obteniendo ventas por producto de Firebase:', error)
    throw error
  }
}

