import { NextRequest, NextResponse } from 'next/server'
import { getProductById, updateProduct, deleteProduct } from '@/lib/db-products'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await getProductById(params.id)
    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, price, description, category, type, stock, imageUrl, size } = body

    // Construir objeto de actualización solo con los campos que se envían
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (price !== undefined) updates.price = Number(price)
    if (description !== undefined) updates.description = description
    if (category !== undefined) updates.category = category
    if (type !== undefined) updates.type = type
    if (stock !== undefined) updates.stock = Number(stock)
    if (imageUrl !== undefined) updates.imageUrl = imageUrl
    if (size !== undefined) updates.size = size

    const updatedProduct = await updateProduct(params.id, updates)

    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedProduct)
  } catch (error: any) {
    console.error('[API] Error actualizando producto:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteProduct(params.id)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}

