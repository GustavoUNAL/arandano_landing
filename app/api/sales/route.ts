import { NextRequest, NextResponse } from 'next/server'
import { createSale, getSales, getSalesByDateRange } from '@/lib/db-sales'
import { updateProduct, getProductById } from '@/lib/db-products'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (startDate && endDate) {
      const sales = getSalesByDateRange(startDate, endDate)
      return NextResponse.json(sales)
    }
    
    const sales = getSales()
    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, total, subtotal, discount, discountType, discountValue, comment, channel, paymentMethod, date, hour } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'La venta debe tener al menos un item' },
        { status: 400 }
      )
    }

    // Usar fecha proporcionada o fecha actual
    const saleDate = date ? new Date(date) : new Date()
    const saleHour = hour !== undefined ? hour : saleDate.getHours()
    
    const sale = createSale({
      date: saleDate.toISOString(),
      hour: saleHour,
      items: items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      })),
      total,
      subtotal: subtotal || total,
      discount: discount || 0,
      discountType: discountType,
      discountValue: discountValue,
      comment: comment,
      channel: channel || 'whatsapp',
      paymentMethod: paymentMethod || 'efectivo',
      ticketNumber: `T-${Date.now()}`
    })

    // Actualizar stock y última fecha de venta de productos
    for (const item of items) {
      const product = getProductById(item.productId)
      if (product) {
        updateProduct(item.productId, {
          stock: product.stock - item.quantity,
          lastSaleDate: saleDate.toISOString(),
          totalSold: (product.totalSold || 0) + item.quantity
        })
      }
    }

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear venta' },
      { status: 500 }
    )
  }
}

