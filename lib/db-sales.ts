/**
 * Servicio de ventas usando Firebase Firestore
 * Mantiene compatibilidad con la interfaz existente
 */

import { db } from './firebase-admin'
import { Sale } from './sales'
import { isDbAvailable } from './db-utils'

// Re-exportar tipos
export type { Sale } from './sales'

// Modo: 'firebase' | 'json' | 'hybrid'
const DB_MODE = (process.env.DB_MODE || 'firebase') as 'firebase' | 'json' | 'hybrid'

// Importar funciones JSON como fallback
import { getSales as getSalesJSON, saveSales as saveSalesJSON, getSalesByDateRange as getSalesByDateRangeJSON, getSalesByProduct as getSalesByProductJSON, getSaleById as getSaleByIdJSON, deleteSale as deleteSaleJSON, createSale as createSaleJSON } from './sales'

export async function getSales(): Promise<Sale[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getSalesJSON()
  }

  try {
    if (!isDbAvailable()) {
      return getSalesJSON()
    }
    
    if (DB_MODE === 'firebase') {
      const snapshot = await db.collection('sales').orderBy('date', 'desc').get()
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Sale))
    } else {
      // Modo híbrido: intentar Firestore, fallback a JSON
      try {
        const snapshot = await db.collection('sales').orderBy('date', 'desc').get()
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Sale))
      } catch (error) {
        console.warn('Error leyendo de Firestore, usando JSON:', error)
        return getSalesJSON()
      }
    }
  } catch (error) {
    console.error('Error obteniendo ventas:', error)
    return getSalesJSON()
  }
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getSaleByIdJSON(id)
  }

  try {
    const docRef = db.collection('sales').doc(id)
    const docSnap = await docRef.get()
    
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Sale
    }
    return undefined
  } catch (error) {
    console.error('Error obteniendo venta:', error)
    return getSaleByIdJSON(id)
  }
}

export async function createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
  const newSale: Sale = {
    ...sale,
    id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  if (DB_MODE === 'json' || !isDbAvailable()) {
    return createSaleJSON(sale)
  }

  try {
    await db.collection('sales').doc(newSale.id).set(newSale)
    
    if (DB_MODE === 'hybrid') {
      const sales = getSalesJSON()
      sales.push(newSale)
      saveSalesJSON(sales)
    }
    
    return newSale
  } catch (error) {
    console.error('Error creando venta:', error)
    return createSaleJSON(sale)
  }
}

export async function deleteSale(id: string): Promise<boolean> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return deleteSaleJSON(id)
  }

  try {
    await db.collection('sales').doc(id).delete()
    
    if (DB_MODE === 'hybrid') {
      const sales = getSalesJSON()
      const filtered = sales.filter(sale => sale.id !== id)
      saveSalesJSON(filtered)
    }
    
    return true
  } catch (error) {
    console.error('Error eliminando venta:', error)
    return deleteSaleJSON(id)
  }
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getSalesByDateRangeJSON(startDate, endDate)
  }

  try {
    const snapshot = await db.collection('sales')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .get()
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Sale))
  } catch (error) {
    console.error('Error obteniendo ventas por rango:', error)
    return getSalesByDateRangeJSON(startDate, endDate)
  }
}

export async function getSalesByProduct(productId: string): Promise<Sale[]> {
  if (DB_MODE === 'json' || !isDbAvailable()) {
    return getSalesByProductJSON(productId)
  }

  try {
    const snapshot = await db.collection('sales')
      .where('items', 'array-contains-any', [{ productId }])
      .orderBy('date', 'desc')
      .get()
    
    // Filtrar en memoria porque Firestore no soporta búsqueda anidada directamente
    const allSales = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Sale))
    return allSales.filter(sale => 
      sale.items.some(item => item.productId === productId)
    )
  } catch (error) {
    console.error('Error obteniendo ventas por producto:', error)
    return getSalesByProductJSON(productId)
  }
}

