/**
 * Script para probar la lógica de agrupación de ventas por día
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n🧪 Probando agrupación de ventas por día...\n')

const sales = db.prepare("SELECT id, date, hour, total, items FROM sales WHERE date >= '2026-01-17' AND date < '2026-01-19' ORDER BY date DESC").all()

// Función de agrupación (similar a la del frontend)
const salesByDay = {}
sales.forEach(sale => {
  const saleDate = new Date(sale.date)
  
  let year, month, day
  
  if (sale.hour !== undefined && sale.hour !== null) {
    const isoMatch = sale.date.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):/)
    if (isoMatch) {
      const utcYear = parseInt(isoMatch[1])
      const utcMonth = parseInt(isoMatch[2])
      const utcDay = parseInt(isoMatch[3])
      const utcHour = parseInt(isoMatch[4])
      
      console.log(`Venta ${sale.id}:`)
      console.log(`  Fecha ISO: ${sale.date}`)
      console.log(`  UTC: ${utcYear}-${utcMonth}-${utcDay} ${utcHour}:00`)
      console.log(`  Hora guardada: ${sale.hour}`)
      
      if (utcHour < sale.hour) {
        // La fecha local es del día anterior
        const localDate = new Date(utcYear, utcMonth - 1, utcDay)
        localDate.setDate(localDate.getDate() - 1)
        year = localDate.getFullYear()
        month = localDate.getMonth() + 1
        day = localDate.getDate()
        console.log(`  → Agrupada como: ${year}-${month}-${day} (día anterior)`)
      } else {
        year = utcYear
        month = utcMonth
        day = utcDay
        console.log(`  → Agrupada como: ${year}-${month}-${day} (mismo día)`)
      }
    } else {
      year = saleDate.getFullYear()
      month = saleDate.getMonth() + 1
      day = saleDate.getDate()
      console.log(`  → Agrupada como: ${year}-${month}-${day} (fallback)`)
    }
  } else {
    year = saleDate.getFullYear()
    month = saleDate.getMonth() + 1
    day = saleDate.getDate()
    console.log(`  → Agrupada como: ${year}-${month}-${day} (sin hora)`)
  }
  
  const dayKey = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
  
  if (!salesByDay[dayKey]) {
    salesByDay[dayKey] = []
  }
  salesByDay[dayKey].push({ id: sale.id, total: sale.total, hour: sale.hour })
  console.log('')
})

console.log('\n📊 Resultado de agrupación:')
Object.keys(salesByDay).sort().forEach(dayKey => {
  const daySales = salesByDay[dayKey]
  const total = daySales.reduce((sum, s) => sum + s.total, 0)
  console.log(`\n${dayKey}: ${daySales.length} ventas, Total: $${total.toLocaleString('es-CO')}`)
  daySales.forEach(s => {
    console.log(`  - $${s.total} (hora: ${s.hour})`)
  })
})

db.close()
