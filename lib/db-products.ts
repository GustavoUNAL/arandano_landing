/**
 * Servicio de productos usando Firebase Firestore
 * Mantiene compatibilidad con la interfaz existente
 */

import { db } from './firebase-admin'
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { Product } from './products'

// Re-exportar Product para que pueda ser importado desde otros archivos
export type { Product } from './products'

// Modo: 'firebase' | 'json' | 'hybrid'
const DB_MODE = (process.env.DB_MODE || 'json') as 'firebase' | 'json' | 'hybrid'

// Importar funciones JSON como fallback
import { getProducts as getProductsJSON, saveProducts as saveProductsJSON } from './products'

export async function getProducts(): Promise<Product[]> {
  if (DB_MODE === 'json') {
    return getProductsJSON()
  }

  try {
    if (DB_MODE === 'firebase') {
      const snapshot = await db.collection('products').get()
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
    } else {
      // Modo híbrido: intentar Firestore, fallback a JSON
      try {
        const snapshot = await db.collection('products').get()
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))
      } catch (error) {
        console.warn('Error leyendo de Firestore, usando JSON:', error)
        return getProductsJSON()
      }
    }
  } catch (error) {
    console.error('Error obteniendo productos:', error)
    // Fallback a JSON en caso de error
    return getProductsJSON()
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (DB_MODE === 'json') {
    const products = getProductsJSON()
    return products.find(p => p.id === id) || null
  }

  try {
    const docRef = db.collection('products').doc(id)
    const docSnap = await docRef.get()
    
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() } as Product
    }
    return null
  } catch (error) {
    console.error('Error obteniendo producto:', error)
    // Fallback
    const products = getProductsJSON()
    return products.find(p => p.id === id) || null
  }
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const newProduct: Product = {
    ...product,
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  if (DB_MODE === 'json') {
    const products = getProductsJSON()
    products.push(newProduct)
    saveProductsJSON(products)
    return newProduct
  }

  try {
    await db.collection('products').doc(newProduct.id).set(newProduct)
    
    // En modo híbrido, también guardar en JSON
    if (DB_MODE === 'hybrid') {
      const products = getProductsJSON()
      products.push(newProduct)
      saveProductsJSON(products)
    }
    
    return newProduct
  } catch (error) {
    console.error('Error creando producto:', error)
    // Fallback a JSON
    const products = getProductsJSON()
    products.push(newProduct)
    saveProductsJSON(products)
    return newProduct
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  if (DB_MODE === 'json') {
    const products = getProductsJSON()
    const index = products.findIndex(p => p.id === id)
    if (index === -1) return null
    
    products[index] = { ...products[index], ...updates }
    saveProductsJSON(products)
    return products[index]
  }

  try {
    const docRef = db.collection('products').doc(id)
    await docRef.update(updates)
    
    const updated = await docRef.get()
    if (!updated.exists) return null
    
    const updatedProduct = { id: updated.id, ...updated.data() } as Product
    
    // En modo híbrido, también actualizar JSON
    if (DB_MODE === 'hybrid') {
      const products = getProductsJSON()
      const index = products.findIndex(p => p.id === id)
      if (index !== -1) {
        products[index] = updatedProduct
        saveProductsJSON(products)
      }
    }
    
    return updatedProduct
  } catch (error) {
    console.error('Error actualizando producto:', error)
    // Fallback a JSON
    const products = getProductsJSON()
    const index = products.findIndex(p => p.id === id)
    if (index === -1) return null
    
    products[index] = { ...products[index], ...updates }
    saveProductsJSON(products)
    return products[index]
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (DB_MODE === 'json') {
    const products = getProductsJSON()
    const filtered = products.filter(p => p.id !== id)
    saveProductsJSON(filtered)
    return filtered.length < products.length
  }

  try {
    await db.collection('products').doc(id).delete()
    
    // En modo híbrido, también eliminar de JSON
    if (DB_MODE === 'hybrid') {
      const products = getProductsJSON()
      const filtered = products.filter(p => p.id !== id)
      saveProductsJSON(filtered)
    }
    
    return true
  } catch (error) {
    console.error('Error eliminando producto:', error)
    // Fallback a JSON
    const products = getProductsJSON()
    const filtered = products.filter(p => p.id !== id)
    saveProductsJSON(filtered)
    return filtered.length < products.length
  }
}

