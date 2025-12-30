import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/products'
import { calculateKPIs, calculateProductAnalytics } from '@/lib/analytics'
import { getSales } from '@/lib/sales'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(new Date().setDate(1)).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()
    
    const products = getProducts()
    const sales = getSales()
    
    // KPIs generales
    const kpis = calculateKPIs(products, startDate, endDate)
    
    // Analytics por producto
    const productAnalytics = products.map(product => 
      calculateProductAnalytics(product, sales)
    )
    
    return NextResponse.json({
      kpis,
      productAnalytics
    })
  } catch (error) {
    console.error('Error calculating analytics:', error)
    return NextResponse.json(
      { error: 'Error al calcular analytics' },
      { status: 500 }
    )
  }
}

