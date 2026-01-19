/**
 * Estructura de datos para recetas
 * Usada para cócteles y cafés
 */

export interface RecipeIngredient {
  productId: string // ID del producto ingrediente en inventario
  productName: string // Nombre del producto ingrediente
  quantity: number // Cantidad requerida
  unit: 'ml' | 'gr' | 'unidad' | 'oz' | 'l' | 'kg' // Unidad de medida
}

export interface Recipe {
  id: string
  productId: string // ID del producto final (cóctel/café)
  productName: string // Nombre del producto final
  category: 'coctel' | 'cafe-caliente' | 'cafe-frio'
  ingredients: RecipeIngredient[]
  createdAt?: string
  updatedAt?: string
}
