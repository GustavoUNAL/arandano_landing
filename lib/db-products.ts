/**
 * Servicio de productos usando Firebase Firestore
 * Mantiene compatibilidad con la interfaz existente
 */

import admin from 'firebase-admin'
import { db } from './firebase-admin'
import { Product } from './products'
import { getDbMode, isDbAvailable } from './db-utils'

// Re-exportar Product para que pueda ser importado desde otros archivos
export type { Product } from './products'

// Tipo helper para documentos de Firestore
type FirestoreProduct = Omit<Product, 'id'>
type FirestoreDocument = admin.firestore.QueryDocumentSnapshot<FirestoreProduct>
type FirestoreDocumentSnapshot = admin.firestore.DocumentSnapshot<FirestoreProduct>

// Función helper para convertir documento a Product
function documentToProduct(doc: FirestoreDocument | FirestoreDocumentSnapshot): Product {
  const data = doc.data()
  if (!data) {
    throw new Error('Document data is undefined')
  }
  return {
    id: doc.id,
    ...data
  }
}

// Importar funciones JSON como fallback (solo si DB_MODE === 'json')
import { getProducts as getProductsJSON, saveProducts as saveProductsJSON } from './products'

export async function getProducts(): Promise<Product[]> {
  const mode = getDbMode()
  
  // Solo usar JSON si está explícitamente configurado
  if (mode === 'json') {
    return getProductsJSON()
  }
  
  // En producción, siempre usar Firebase - NO fallback automático
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }
  
  try {
    const snapshot = await db.collection('products').get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToProduct(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo productos de Firebase:', error)
    throw error // No hacer fallback automático en producción
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    const products = getProductsJSON()
    return products.find(p => p.id === id) || null
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }
  
  try {
    const docRef = db.collection('products').doc(id)
    const docSnap = await docRef.get() as FirestoreDocumentSnapshot
    
    if (docSnap.exists) {
      return documentToProduct(docSnap)
    }
    return null
  } catch (error) {
    console.error('[DB] Error obteniendo producto de Firebase:', error)
    throw error
  }
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const mode = getDbMode()
  const newProduct: Product = {
    ...product,
    id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  if (mode === 'json') {
    const products = getProductsJSON()
    products.push(newProduct)
    saveProductsJSON(products)
    return newProduct
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('products').doc(newProduct.id).set(newProduct)
    return newProduct
  } catch (error) {
    console.error('[DB] Error creando producto en Firebase:', error)
    throw error
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    const products = getProductsJSON()
    const index = products.findIndex(p => p.id === id)
    if (index === -1) return null
    
    products[index] = { ...products[index], ...updates }
    saveProductsJSON(products)
    return products[index]
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const docRef = db.collection('products').doc(id)
    await docRef.update(updates)
    
    const updated = await docRef.get() as FirestoreDocumentSnapshot
    if (!updated.exists) return null
    
    return documentToProduct(updated)
  } catch (error) {
    console.error('[DB] Error actualizando producto en Firebase:', error)
    throw error
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    const products = getProductsJSON()
    const filtered = products.filter(p => p.id !== id)
    saveProductsJSON(filtered)
    return filtered.length < products.length
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('products').doc(id).delete()
    return true
  } catch (error) {
    console.error('[DB] Error eliminando producto de Firebase:', error)
    throw error
  }
}

