/**
 * Servicio de recetas usando SQLite
 */

import { getDatabase } from './db-sqlite'
import { Recipe, RecipeIngredient } from './recipes'

export async function getRecipes(): Promise<Recipe[]> {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM recipes ORDER BY productName').all() as any[]
  
  return rows.map(row => ({
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    category: row.category as Recipe['category'],
    ingredients: JSON.parse(row.ingredients) as RecipeIngredient[],
    createdAt: row.createdAt || undefined,
    updatedAt: row.updatedAt || undefined
  }))
}

export async function getRecipeByProductId(productId: string): Promise<Recipe | null> {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM recipes WHERE productId = ?').get(productId) as any
  
  if (!row) return null
  
  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    category: row.category as Recipe['category'],
    ingredients: JSON.parse(row.ingredients) as RecipeIngredient[],
    createdAt: row.createdAt || undefined,
    updatedAt: row.updatedAt || undefined
  }
}

export async function createRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
  const db = getDatabase()
  const id = `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  db.prepare(`
    INSERT INTO recipes (
      id, productId, productName, category, ingredients, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    recipe.productId,
    recipe.productName,
    recipe.category,
    JSON.stringify(recipe.ingredients),
    now,
    now
  )
  
  const created = await getRecipeByProductId(recipe.productId)
  if (!created) throw new Error('Error creando receta')
  return created
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
  const db = getDatabase()
  const now = new Date().toISOString()
  
  const fields: string[] = []
  const values: any[] = []
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      if (key === 'ingredients') {
        fields.push('ingredients = ?')
        values.push(JSON.stringify(value))
      } else {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
  })
  
  if (fields.length === 0) {
    const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      id: row.id,
      productId: row.productId,
      productName: row.productName,
      category: row.category as Recipe['category'],
      ingredients: JSON.parse(row.ingredients) as RecipeIngredient[],
      createdAt: row.createdAt || undefined,
      updatedAt: row.updatedAt || undefined
    }
  }
  
  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)
  
  db.prepare(`UPDATE recipes SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as any
  if (!row) return null
  
  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    category: row.category as Recipe['category'],
    ingredients: JSON.parse(row.ingredients) as RecipeIngredient[],
    createdAt: row.createdAt || undefined,
    updatedAt: row.updatedAt || undefined
  }
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM recipes WHERE id = ?').run(id)
  return result.changes > 0
}
