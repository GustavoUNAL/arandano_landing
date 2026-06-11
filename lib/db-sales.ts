/**
 * Servicio de ventas usando SQLite
 * Mantiene compatibilidad con la interfaz existente
 */

import { Sale } from './sales'
import { getDbMode } from './db-utils'

// Re-exportar tipos
export type { Sale } from './sales'

// Importar funciones JSON (solo si DB_MODE === 'json')
import { getSales as getSalesJSON, saveSales as saveSalesJSON, getSalesByDateRange as getSalesByDateRangeJSON, getSalesByProduct as getSalesByProductJSON, getSaleById as getSaleByIdJSON, deleteSale as deleteSaleJSON, createSale as createSaleJSON, updateSale as updateSaleJSON } from './sales'
// Importar funciones SQLite
import {
  getSales as getSalesSQLite,
  getSaleById as getSaleByIdSQLite,
  createSale as createSaleSQLite,
  updateSale as updateSaleSQLite,
  deleteSale as deleteSaleSQLite,
  getSalesByDateRange as getSalesByDateRangeSQLite,
  getSalesByYear as getSalesByYearSQLite
} from './db-sqlite-sales'

export async function getSales(): Promise<Sale[]> {
  if (getDbMode() === 'json') return getSalesJSON()
  return getSalesSQLite()
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  if (getDbMode() === 'json') return getSaleByIdJSON(id)
  return getSaleByIdSQLite(id)
}

export async function createSale(sale: Omit<Sale, 'id'>): Promise<Sale> {
  if (getDbMode() === 'json') return createSaleJSON(sale)
  return createSaleSQLite(sale)
}

export async function updateSale(id: string, updates: Partial<Sale>): Promise<Sale | null> {
  if (getDbMode() === 'json') return updateSaleJSON(id, updates)
  return updateSaleSQLite(id, updates)
}

export async function deleteSale(id: string): Promise<boolean> {
  if (getDbMode() === 'json') return deleteSaleJSON(id)
  return deleteSaleSQLite(id)
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  if (getDbMode() === 'json') return getSalesByDateRangeJSON(startDate, endDate)
  return getSalesByDateRangeSQLite(startDate, endDate)
}

export async function getSalesByProduct(productId: string): Promise<Sale[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return getSalesByProductJSON(productId)
  }
  
  // Para SQLite, obtener todas las ventas y filtrar en memoria
  // (o se puede implementar una búsqueda más eficiente si es necesario)
  const sales = getDbMode() === 'json' ? await getSalesJSON() : await getSalesSQLite()
  return sales.filter((sale: Sale) => 
    sale.items.some((item) => item.productId === productId)
  )
}
