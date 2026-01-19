import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/db-products'
import { calculateKPIs, calculateProductAnalytics, calculateWeeklyKPIs, calculateMonthlyKPIs } from '@/lib/analytics'
import { getSales } from '@/lib/db-sales'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') || 'range' // 'range', 'week', 'month'
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear()
    
    const products = await getProducts()
    const sales = await getSales()
    
    if (groupBy === 'week') {
      // KPIs agrupados por semana
      const weeklyKPIs = await calculateWeeklyKPIs(products, year)
      
      // Analytics por producto
      const productAnalytics = products.map(product => 
        calculateProductAnalytics(product, sales)
      )
      
      return NextResponse.json({
        kpis: null,
        weeklyKPIs,
        monthlyKPIs: null,
        productAnalytics
      })
    } else if (groupBy === 'month') {
      // KPIs agrupados por mes (solo meses con 4 semanas completas)
      const monthlyKPIs = await calculateMonthlyKPIs(products, year)
      
      // Analytics por producto
      const productAnalytics = products.map(product => 
        calculateProductAnalytics(product, sales)
      )
      
      return NextResponse.json({
        kpis: null,
        weeklyKPIs: null,
        monthlyKPIs,
        productAnalytics
      })
    } else {
      // KPIs por rango de fechas (comportamiento original)
      const start = startDate || new Date(new Date().setDate(1)).toISOString()
      const end = endDate || new Date().toISOString()
      
      const kpis = await calculateKPIs(products, start, end)
      
      // Analytics por producto
      const productAnalytics = products.map(product => 
        calculateProductAnalytics(product, sales)
      )
      
      return NextResponse.json({
        kpis,
        weeklyKPIs: null,
        monthlyKPIs: null,
        productAnalytics
      })
    }
  } catch (error) {
    console.error('Error calculating analytics:', error)
    return NextResponse.json(
      { error: 'Error al calcular analytics' },
      { status: 500 }
    )
  }
}

