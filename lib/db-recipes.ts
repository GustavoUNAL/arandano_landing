/**
 * Servicio de recetas usando Firebase Firestore
 */

import admin from 'firebase-admin'
import { db } from './firebase-admin'
import { Recipe, RecipeIngredient } from './recipes'
import { getDbMode, isDbAvailable } from './db-utils'

// Re-exportar tipos
export type { Recipe, RecipeIngredient } from './recipes'

// Tipo helper para documentos de Firestore
type FirestoreRecipe = Omit<Recipe, 'id'>
type FirestoreDocument = admin.firestore.QueryDocumentSnapshot<FirestoreRecipe>
type FirestoreDocumentSnapshot = admin.firestore.DocumentSnapshot<FirestoreRecipe>

// Función helper para convertir documento a Recipe
function documentToRecipe(doc: FirestoreDocument | FirestoreDocumentSnapshot): Recipe {
  const data = doc.data()
  if (!data) {
    throw new Error('Document data is undefined')
  }
  return {
    id: doc.id,
    ...data
  }
}

export async function getRecipes(): Promise<Recipe[]> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    // JSON mode not implemented for recipes - always use Firebase
    return []
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }
  
  try {
    const snapshot = await db.collection('recipes').get()
    return snapshot.docs.map((doc: FirestoreDocument) => documentToRecipe(doc))
  } catch (error) {
    console.error('[DB] Error obteniendo recetas de Firebase:', error)
    throw error
  }
}

export async function getRecipeByProductId(productId: string): Promise<Recipe | null> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return null
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }
  
  try {
    const snapshot = await db.collection('recipes')
      .where('productId', '==', productId)
      .limit(1)
      .get()
    
    if (snapshot.empty) {
      return null
    }
    
    return documentToRecipe(snapshot.docs[0])
  } catch (error) {
    console.error('[DB] Error obteniendo receta por producto de Firebase:', error)
    throw error
  }
}

export async function createRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
  const mode = getDbMode()
  
  const newRecipe: Recipe = {
    ...recipe,
    id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  if (mode === 'json') {
    throw new Error('Recetas solo están disponibles en modo Firebase')
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('recipes').doc(newRecipe.id).set(newRecipe)
    return newRecipe
  } catch (error) {
    console.error('[DB] Error creando receta en Firebase:', error)
    throw error
  }
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return null
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    const docRef = db.collection('recipes').doc(id)
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }
    await docRef.update(updateData)
    
    const updated = await docRef.get() as FirestoreDocumentSnapshot
    if (!updated.exists) return null
    
    return documentToRecipe(updated)
  } catch (error) {
    console.error('[DB] Error actualizando receta en Firebase:', error)
    throw error
  }
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const mode = getDbMode()
  
  if (mode === 'json') {
    return false
  }
  
  if (!isDbAvailable()) {
    throw new Error('[DB] Firebase no disponible pero DB_MODE es firebase. Verifica configuración de Firebase.')
  }

  try {
    await db.collection('recipes').doc(id).delete()
    return true
  } catch (error) {
    console.error('[DB] Error eliminando receta de Firebase:', error)
    throw error
  }
}
