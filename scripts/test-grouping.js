/**
 * Script para probar la agrupación de ventas
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

const sales = db.prepare('SELECT id, date, total FROM sales WHERE total IN (108000, 56500, 24500, 10500) ORDER BY date').all()

console.log('Simulando agrupación como en el frontend:\n')

const salesByDay = {}
sales.forEach(sale => {
  const saleDate = new Date(sale.date)
  const year = saleDate.getFullYear()
  const month = String(saleDate.getMonth() + 1).padStart(2, '0')
  const day = String(saleDate.getDate()).padStart(2, '0')
  const dayKey = `${day}/${month}/${year}`
  
  if (!salesByDay[dayKey]) {
    salesByDay[dayKey] = []
  }
  salesByDay[dayKey].push(sale.total)
})

Object.keys(salesByDay).sort().forEach(key => {
  const total = salesByDay[key].reduce((a, b) => a + b, 0)
  const dayName = new Date(key.split('/').reverse().join('-')).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  console.log(`${dayName.charAt(0).toUpperCase() + dayName.slice(1)} (${key}): $${total.toLocaleString('es-CO')} (${salesByDay[key].length} ventas)`)
})

db.close()
