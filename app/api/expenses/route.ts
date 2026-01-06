import { NextRequest, NextResponse } from 'next/server'
import { getExpenses, createExpense, getExpensesByDateRange } from '@/lib/db-expenses'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    if (startDate && endDate) {
      const expenses = getExpensesByDateRange(startDate, endDate)
      return NextResponse.json(expenses)
    }
    
    const expenses = getExpenses()
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener gastos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, type, category, description, amount, notes } = body

    if (!date || !type || !category || !description || amount === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const expense = createExpense({
      date,
      type,
      category,
      description,
      amount: Number(amount),
      notes: notes || ''
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al crear gasto' },
      { status: 500 }
    )
  }
}

