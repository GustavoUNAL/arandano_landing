/**
 * Servicio de productos usando SQLite
 * Mantiene compatibilidad con la interfaz existente
 */

import { Product } from './products'
import { getDbMode } from './db-utils'

// Re-exportar Product para que pueda ser importado desde otros archivos
export type { Product } from './products'

// Importar funciones JSON como fallback (solo si DB_MODE === 'json')
import { getProducts as getProductsJSON, saveProducts as saveProductsJSON } from './products'
// Importar funciones SQLite
import {
  getProducts as getProductsSQLite,
  getProductById as getProductByIdSQLite,
  createProduct as createProductSQLite,
  updateProduct as updateProductSQLite,
  deleteProduct as deleteProductSQLite
} from './db-sqlite-products'

export async function getProducts(): Promise<Product[]> {
  if (getDbMode() === 'json') return getProductsJSON()
  return getProductsSQLite()
}

export async function getProductById(id: string): Promise<Product | null> {
  if (getDbMode() === 'json') {
    const products = getProductsJSON()
    return products.find((p) => p.id === id) || null
  }
  return getProductByIdSQLite(id)
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  if (getDbMode() === 'json') {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    const products = getProductsJSON()
    products.push(newProduct)
    saveProductsJSON(products)
    return newProduct
  }
  return createProductSQLite(product)
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  if (getDbMode() === 'json') {
    const products = getProductsJSON()
    const index = products.findIndex(p => p.id === id)
    if (index === -1) return null
    
    products[index] = { ...products[index], ...updates }
    saveProductsJSON(products)
    return products[index]
  }
  return updateProductSQLite(id, updates)
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (getDbMode() === 'json') {
    const products = getProductsJSON()
    const filtered = products.filter(p => p.id !== id)
    saveProductsJSON(filtered)
    return filtered.length < products.length
  }
  return deleteProductSQLite(id)
}
