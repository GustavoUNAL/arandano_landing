import fs from 'fs'
import path from 'path'

export interface Sale {
  id: string
  date: string // ISO string
  hour: number // 0-23
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  total: number
  channel: 'presencial' | 'whatsapp'
  paymentMethod?: 'efectivo' | 'nequi' | 'daviplata'
  ticketNumber?: string
}

const salesFilePath = path.join(process.cwd(), 'data', 'sales.json')

export function getSales(): Sale[] {
  try {
    if (!fs.existsSync(salesFilePath)) {
      return []
    }
    const fileContents = fs.readFileSync(salesFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    console.error('Error reading sales file:', error)
    return []
  }
}

export function saveSales(sales: Sale[]): void {
  try {
    fs.writeFileSync(salesFilePath, JSON.stringify(sales, null, 2), 'utf8')
  } catch (error) {
    console.error('Error writing sales file:', error)
    throw error
  }
}

export function createSale(sale: Omit<Sale, 'id'>): Sale {
  const sales = getSales()
  const newSale: Sale = {
    ...sale,
    id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  sales.push(newSale)
  saveSales(sales)
  return newSale
}

export function getSalesByDateRange(startDate: string, endDate: string): Sale[] {
  const sales = getSales()
  return sales.filter(sale => {
    const saleDate = new Date(sale.date)
    const start = new Date(startDate)
    const end = new Date(endDate)
    return saleDate >= start && saleDate <= end
  })
}

export function getSalesByProduct(productId: string): Sale[] {
  const sales = getSales()
  return sales.filter(sale => 
    sale.items.some(item => item.productId === productId)
  )
}

