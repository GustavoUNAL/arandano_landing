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

    const nameStr = (name != null && String(name).trim() !== '') ? String(name).trim() : ''
    const descStr = (description != null && String(description).trim() !== '') ? String(description).trim() : ''

    if (!nameStr) {
      return NextResponse.json(
        { error: 'El producto debe tener un nombre.' },
        { status: 400 }
      )
    }
    if (!descStr) {
      return NextResponse.json(
        { error: 'El producto debe tener una descripción.' },
        { status: 400 }
      )
    }
    if (price == null || Number(price) < 0) {
      return NextResponse.json(
        { error: 'El producto debe tener un precio válido.' },
        { status: 400 }
      )
    }
    if (!category || !type) {
      return NextResponse.json(
        { error: 'Faltan categoría o tipo de producto.' },
        { status: 400 }
      )
    }

    const newProduct = await createProduct({
      name: nameStr,
      price: Number(price),
      description: descStr,
      category,
      type,
      stock: stock !== undefined ? Number(stock) : 0,
      imageUrl: imageUrl || '',
      size: size != null ? String(size).trim() : ''
    })

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error: any) {
    if (error?.message === 'DUPLICATE_PRODUCT' || error?.code === 'DUPLICATE_PRODUCT') {
      return NextResponse.json(
        { error: 'Ya existe un producto con el mismo nombre y presentación (tamaño).' },
        { status: 409 }
      )
    }
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

