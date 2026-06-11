/**
 * Servicio de recetas (SQLite / PostgreSQL)
 */

import { dbAll, dbGet, dbRun } from './db'
import { Recipe, RecipeIngredient } from './recipes'

function mapRecipe(row: Record<string, unknown>): Recipe {
  return {
    id: row.id as string,
    productId: row.productId as string,
    productName: row.productName as string,
    category: row.category as Recipe['category'],
    ingredients: JSON.parse(row.ingredients as string) as RecipeIngredient[],
    createdAt: (row.createdAt as string) || undefined,
    updatedAt: (row.updatedAt as string) || undefined,
  }
}

export async function getRecipes(): Promise<Recipe[]> {
  const rows = await dbAll<Record<string, unknown>>('SELECT * FROM recipes ORDER BY productName')
  return rows.map(mapRecipe)
}

export async function getRecipeByProductId(productId: string): Promise<Recipe | null> {
  const row = await dbGet<Record<string, unknown>>('SELECT * FROM recipes WHERE productId = ?', [
    productId,
  ])
  if (!row) return null
  return mapRecipe(row)
}

export async function createRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
  const id = `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()

  await dbRun(
    `INSERT INTO recipes (
      id, productId, productName, category, ingredients, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      recipe.productId,
      recipe.productName,
      recipe.category,
      JSON.stringify(recipe.ingredients),
      now,
      now,
    ]
  )

  const created = await getRecipeByProductId(recipe.productId)
  if (!created) throw new Error('Error creando receta')
  return created
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
  const now = new Date().toISOString()
  const fields: string[] = []
  const values: unknown[] = []

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
    const row = await dbGet<Record<string, unknown>>('SELECT * FROM recipes WHERE id = ?', [id])
    if (!row) return null
    return mapRecipe(row)
  }

  fields.push('updatedAt = ?')
  values.push(now)
  values.push(id)

  await dbRun(`UPDATE recipes SET ${fields.join(', ')} WHERE id = ?`, values)

  const row = await dbGet<Record<string, unknown>>('SELECT * FROM recipes WHERE id = ?', [id])
  if (!row) return null
  return mapRecipe(row)
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const result = await dbRun('DELETE FROM recipes WHERE id = ?', [id])
  return result.changes > 0
}
