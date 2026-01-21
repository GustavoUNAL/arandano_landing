import { NextRequest, NextResponse } from 'next/server'
import { getRecipes, createRecipe } from '@/lib/db-recipes'
import { Recipe, RecipeIngredient } from '@/lib/recipes'
import { getCachedRecipes, clearRecipesCache } from '@/lib/recipes-cache'
import { getProductById } from '@/lib/db-products'

/**
 * GET /api/recipes
 * Obtiene todas las recetas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    
    console.log('[API] Obteniendo recetas...')
    // Usar caché para reducir consultas
    const recipes = await getCachedRecipes(getRecipes)
    console.log(`[API] Recetas obtenidas: ${recipes.length}`)
    
    if (productId) {
      const recipe = recipes.find(r => r.productId === productId)
      if (!recipe) {
        return NextResponse.json(null)
      }
      return NextResponse.json(recipe)
    }
    
    return NextResponse.json(recipes)
  } catch (error: any) {
    console.error('[API] Error obteniendo recetas:', error)
    const errorMessage = error?.message || String(error || 'Error desconocido')
    
    // Log detallado del error en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Detalles del error:', {
        message: errorMessage,
        name: error?.name,
        code: error?.code,
        stack: error?.stack
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Error al obtener recetas',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recipes
 * Crea una nueva receta
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productName, category, ingredients } = body

    // Validación básica
    if (!productId || !productName || !category || !ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: productId, productName, category, ingredients' },
        { status: 400 }
      )
    }

    // Validar categoría
    if (!['coctel', 'cafe-caliente', 'cafe-frio'].includes(category)) {
      return NextResponse.json(
        { error: 'Categoría inválida. Debe ser: coctel, cafe-caliente o cafe-frio' },
        { status: 400 }
      )
    }

    // Validar que el producto existe y tiene la categoría correcta
    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json(
        { error: `Producto con ID ${productId} no encontrado` },
        { status: 404 }
      )
    }

    // Solo productos compuestos (coctel, cafe-caliente, cafe-frio) pueden tener receta
    if (product.category !== category) {
      return NextResponse.json(
        { 
          error: `El producto "${product.name}" tiene categoría "${product.category}" pero la receta especifica "${category}". Solo productos compuestos (coctel, cafe-caliente, cafe-frio) pueden tener receta.` 
        },
        { status: 400 }
      )
    }

    if (!['coctel', 'cafe-caliente', 'cafe-frio'].includes(product.category)) {
      return NextResponse.json(
        { 
          error: `El producto "${product.name}" no puede tener receta. Solo productos compuestos (coctel, cafe-caliente, cafe-frio) pueden tener receta. Este producto es de categoría "${product.category}" y se vende directamente.` 
        },
        { status: 400 }
      )
    }

    // Validar ingredientes
    if (ingredients.length === 0) {
      return NextResponse.json(
        { error: 'La receta debe tener al menos un ingrediente' },
        { status: 400 }
      )
    }

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

    const newRecipe: Omit<Recipe, 'id'> = {
      productId,
      productName,
      category,
      ingredients: ingredients as RecipeIngredient[]
    }

    const recipe = await createRecipe(newRecipe)
    // Limpiar caché después de crear una receta
    clearRecipesCache()
    return NextResponse.json(recipe, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error creando receta:', error)
    return NextResponse.json(
      { 
        error: 'Error al crear receta',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
