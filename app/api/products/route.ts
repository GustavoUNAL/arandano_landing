import { NextRequest, NextResponse } from 'next/server'
import { getProducts, createProduct, Product } from '@/lib/db-products'
import { getProducts as getProductsJSON } from '@/lib/products'

export async function GET() {
  try {
    const products = await getProducts()
    return NextResponse.json(products)
  } catch (error: any) {
    console.error('[API] Error obteniendo productos:', error)
    console.error('[API] Stack trace:', error?.stack)
    const errorMessage = error?.message || 'Error desconocido al obtener productos'
    
    // Intentar usar JSON como fallback si hay error con SQLite
    try {
      const jsonProducts = getProductsJSON()
      return NextResponse.json(jsonProducts)
    } catch (fallbackError) {
      // Ignorar error de fallback
    }
    
    return NextResponse.json(
      { 
        error: 'Error al obtener productos',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, price, description, category, type, stock, imageUrl, size } = body

    // Validación básica
    if (!name || !price || !category || !type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const newProduct = await createProduct({
      name,
      price: Number(price),
      description: description || '',
      category,
      type,
      stock: stock !== undefined ? Number(stock) : 0, // Cambiar default de 999 a 0
      imageUrl: imageUrl || '',
      size: size || ''
    })

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error creando producto:', error)
    const errorMessage = error?.message || 'Error desconocido al crear producto'
    return NextResponse.json(
      { 
        error: 'Error al crear producto',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

