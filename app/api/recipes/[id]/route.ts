import { NextRequest, NextResponse } from 'next/server'
import { getRecipes, updateRecipe, deleteRecipe, getRecipeByProductId } from '@/lib/db-recipes'
import { RecipeIngredient } from '@/lib/recipes'
import { getCachedRecipes, clearRecipesCache } from '@/lib/recipes-cache'
import { getProductById } from '@/lib/db-products'

/**
 * GET /api/recipes/[id]
 * Obtiene una receta por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Usar caché para reducir consultas
    const recipes = await getCachedRecipes(getRecipes)
    const recipe = recipes.find(r => r.id === params.id)

    if (!recipe) {
      return NextResponse.json(
        { error: 'Receta no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(recipe)
  } catch (error: any) {
    console.error('[API] Error obteniendo receta:', error)
    return NextResponse.json(
      { 
        error: 'Error al obtener receta',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/recipes/[id]
 * Actualiza una receta
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { productName, category, ingredients } = body

    // Obtener receta actual para validar productId
    const recipes = await getCachedRecipes(getRecipes)
    const currentRecipe = recipes.find(r => r.id === params.id)
    if (!currentRecipe) {
      return NextResponse.json(
        { error: 'Receta no encontrada' },
        { status: 404 }
      )
    }

    // Construir objeto de actualización
    const updates: any = {}
    if (productName !== undefined) updates.productName = productName
    if (category !== undefined) {
      if (!['coctel', 'cafe-caliente', 'cafe-frio'].includes(category)) {
        return NextResponse.json(
          { error: 'Categoría inválida. Debe ser: coctel, cafe-caliente o cafe-frio' },
          { status: 400 }
        )
      }
      
      // Validar que el producto asociado tiene la categoría correcta
      const product = await getProductById(currentRecipe.productId)
      if (product && product.category !== category) {
        return NextResponse.json(
          { 
            error: `No se puede cambiar la categoría de la receta. El producto "${product.name}" tiene categoría "${product.category}" pero la receta especifica "${category}". Solo productos compuestos (coctel, cafe-caliente, cafe-frio) pueden tener receta.` 
          },
          { status: 400 }
        )
      }
      
      updates.category = category
    }
    if (ingredients !== undefined) {
      if (!Array.isArray(ingredients)) {
        return NextResponse.json(
          { error: 'Ingredients debe ser un array' },
          { status: 400 }
        )
      }
      
      if (ingredients.length === 0) {
        return NextResponse.json(
          { error: 'La receta debe tener al menos un ingrediente' },
          { status: 400 }
        )
      }

      // Validar cada ingrediente
      for (const ingredient of ingredients) {
        if (!ingredient.productId || !ingredient.productName || !ingredient.quantity || !ingredient.unit) {
          return NextResponse.json(
            { error: 'Cada ingrediente debe tener: productId, productName, quantity y unit' },
            { status: 400 }
          )
        }
        
        if (ingredient.quantity <= 0) {
          return NextResponse.json(
            { error: 'La cantidad de cada ingrediente debe ser mayor a 0' },
            { status: 400 }
          )
        }
        
        if (!['ml', 'gr', 'unidad', 'oz', 'l', 'kg'].includes(ingredient.unit)) {
          return NextResponse.json(
            { error: 'Unidad inválida. Debe ser: ml, gr, unidad, oz, l o kg' },
            { status: 400 }
          )
        }
      }
      
      updates.ingredients = ingredients as RecipeIngredient[]
    }

    const updatedRecipe = await updateRecipe(params.id, updates)

    if (!updatedRecipe) {
      return NextResponse.json(
        { error: 'Receta no encontrada' },
        { status: 404 }
      )
    }

    // Limpiar caché después de actualizar
    clearRecipesCache()
    return NextResponse.json(updatedRecipe)
  } catch (error: any) {
    console.error('[API] Error actualizando receta:', error)
    return NextResponse.json(
      { 
        error: 'Error al actualizar receta',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recipes/[id]
 * Elimina una receta
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteRecipe(params.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Receta no encontrada' },
        { status: 404 }
      )
    }

    // Limpiar caché después de eliminar
    clearRecipesCache()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error eliminando receta:', error)
    return NextResponse.json(
      { 
        error: 'Error al eliminar receta',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
