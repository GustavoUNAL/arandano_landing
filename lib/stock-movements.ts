/**
 * Estructura para movimientos de stock (kardex)
 */

export interface StockMovement {
  id: string
  type: 'sale' | 'purchase' | 'adjustment' | 'recipe-consumption'
  productId?: string // ID del producto (si aplica)
  inventoryItemId?: string // ID del item de inventario (si aplica)
  productName?: string // Nombre del producto/item
  quantity: number // Cantidad (positiva o negativa según tipo)
  unit: string // Unidad de medida
  saleId?: string // ID de la venta (si es movimiento por venta)
  recipeId?: string // ID de la receta (si es consumo de ingrediente)
  date: string // Fecha del movimiento (ISO string)
  comment?: string // Comentario adicional
  createdAt?: string
}
