/**
 * Servicio de recetas usando SQLite
 */

import { Recipe, RecipeIngredient } from './recipes'
import { getDbMode } from './db-utils'

// Re-exportar tipos
export type { Recipe, RecipeIngredient } from './recipes'

// Importar funciones SQLite
import {
  getRecipes as getRecipesSQLite,
  getRecipeByProductId as getRecipeByProductIdSQLite,
  createRecipe as createRecipeSQLite,
  updateRecipe as updateRecipeSQLite,
  deleteRecipe as deleteRecipeSQLite
} from './db-sqlite-recipes'

export async function getRecipes(): Promise<Recipe[]> {
  const mode = getDbMode()
  
  if (mode === 'sqlite') {
    return getRecipesSQLite()
  }
  
  // JSON mode not implemented for recipes
  return []
}

export async function getRecipeByProductId(productId: string): Promise<Recipe | null> {
  const mode = getDbMode()
  
  if (mode === 'sqlite') {
    return getRecipeByProductIdSQLite(productId)
  }
  
  return null
}

export async function createRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
  const mode = getDbMode()
  
  if (mode === 'sqlite') {
    return createRecipeSQLite(recipe)
  }
  
  throw new Error('Recetas solo están disponibles en modo SQLite')
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
  const mode = getDbMode()
  
  if (mode === 'sqlite') {
    return updateRecipeSQLite(id, updates)
  }
  
  return null
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const mode = getDbMode()
  
  if (mode === 'sqlite') {
    return deleteRecipeSQLite(id)
  }
  
  return false
}
