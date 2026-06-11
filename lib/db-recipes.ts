/**
 * Servicio de recetas (SQLite / PostgreSQL)
 */

import { Recipe, RecipeIngredient } from './recipes'
import { getDbMode } from './db-utils'

export type { Recipe, RecipeIngredient } from './recipes'

import {
  getRecipes as getRecipesSQLite,
  getRecipeByProductId as getRecipeByProductIdSQLite,
  createRecipe as createRecipeSQLite,
  updateRecipe as updateRecipeSQLite,
  deleteRecipe as deleteRecipeSQLite,
} from './db-sqlite-recipes'

export async function getRecipes(): Promise<Recipe[]> {
  if (getDbMode() === 'json') return []
  return getRecipesSQLite()
}

export async function getRecipeByProductId(productId: string): Promise<Recipe | null> {
  if (getDbMode() === 'json') return null
  return getRecipeByProductIdSQLite(productId)
}

export async function createRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
  if (getDbMode() === 'json') {
    throw new Error('Recetas solo están disponibles con base de datos relacional')
  }
  return createRecipeSQLite(recipe)
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
  if (getDbMode() === 'json') return null
  return updateRecipeSQLite(id, updates)
}

export async function deleteRecipe(id: string): Promise<boolean> {
  if (getDbMode() === 'json') return false
  return deleteRecipeSQLite(id)
}
