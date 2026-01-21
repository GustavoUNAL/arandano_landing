/**
 * Script para comparar las ventas registradas con el registro manual
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n📋 COMPARACIÓN DE VENTAS - Registro Manual vs Base de Datos\n')
console.log('═'.repeat(80))

// Obtener todas las ventas
const dbSales = db.prepare("SELECT * FROM sales WHERE date >= '2025-12-30' ORDER BY date ASC, hour ASC").all()

// Parsear ventas de la BD por fecha
const salesByDate = {}
dbSales.forEach(sale => {
  const date = new Date(sale.date)
  const dateKey = date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' })
  
  if (!salesByDate[dateKey]) {
    salesByDate[dateKey] = []
  }
  salesByDate[dateKey].push(sale)
})

// Datos del registro manual (del usuario)
const manualSales = {
  '30/12/25': [
    { desc: 'Sixpack latón', total: 35000, pago: 'Mixto' },
    { desc: 'Cócteles (6)', total: 45000, pago: 'Nequi' }
  ],
  '31/12/25': [
    { desc: 'Café', total: 5000, pago: 'Efectivo' }
  ],
  '01/01/26': [],
  '02/01/26': [],
  '03/01/26': [
    { desc: 'Combo café + pastel', total: 24000 },
    { desc: 'Vaso de leche', total: 10000 },
    { desc: 'Café', total: 5000 },
    { desc: 'Moscow mule (2)', total: 20000 },
    { desc: 'Canoca', total: 10000 }
  ],
  '04/01/26': [
    { desc: 'Carajillo', total: 8000 },
    { desc: 'Café soft brew', total: 12000 },
    { desc: 'Café artesanal con leche', total: 5000 },
    { desc: 'Moscow mule', total: 15000 },
    { desc: 'Cervezas (mix) 3', total: 24000 }
  ],
  '05/01/26': [
    { desc: 'Venta Nequi Mauricio', total: 196000, pago: 'Nequi' }
  ],
  '06/01/26': [
    { desc: 'Carajillo', total: 8000 },
    { desc: 'Combo café + pastel (2)', total: 24000 },
    { desc: 'Café negro artesanal (4)', total: 20000 },
    { desc: 'Combo café + pastel', total: 12000 },
    { desc: 'Café negro artesanal (2)', total: 8000 },
    { desc: 'Cócteles (2)', total: 30000 },
    { desc: 'Hervido (3)', total: 15000 },
    { desc: 'Cariocas (10)', total: 140000 },
    { desc: 'Entrada Nequi Sebastián', total: 80000, pago: 'Nequi' }
  ],
  '07/01/26': [
    { desc: 'Sándwich del día', total: 10000 },
    { desc: 'Galleta', total: 1000 },
    { desc: 'Café negro artesanal', total: 4000 }
  ],
  '08/01/26': [],
  '09/01/26': [],
  '10/01/26': [],
  '11/01/26': [],
  '12/01/26': [],
  '13/01/26': [],
  '14/01/26': [
    { desc: 'Hervido (14)', total: 70000 },
    { desc: 'Pastel del día', total: 7000 }
  ],
  '15/01/26': [
    { desc: 'Budweiser (2)', total: 10000 }
  ],
  '16/01/26': [
    { desc: 'Hervido', total: 5000 },
    { desc: 'Café negro artesanal', total: 4000 },
    { desc: 'Vaso de leche', total: 5000 },
    { desc: 'Acompañante del día (2)', total: 6000 },
    { desc: 'Poker 330 (4)', total: 14000 }
  ],
  '17/01/26': [
    { desc: 'Hervido (2)', total: 10000 },
    { desc: 'Poker 330 (7)', total: 31500 },
    { desc: 'Budweiser (3)', total: 15000 },
    { desc: 'Heineken (6)', total: 30000 },
    { desc: 'Budweiser (3)', total: 15000 },
    { desc: 'Poker 330 (3)', total: 13500 },
    { desc: 'Shots (4)', total: 48000 },
    { desc: 'Cigarrillo', total: 1000 },
    { desc: 'Propina', total: 500 }
  ],
  '18/01/26': [
    { desc: 'Poker 330 (3)', total: 10500 }
  ]
}

console.log('\n📊 COMPARACIÓN POR FECHA:\n')

let totalManual = 0
let totalBD = 0
let ventasFaltantes = []
let ventasSobrantes = []

Object.keys(manualSales).forEach(dateKey => {
  const manual = manualSales[dateKey]
  const dbDay = salesByDate[dateKey] || []
  
  const manualTotal = manual.reduce((sum, s) => sum + s.total, 0)
  const dbTotal = dbDay.reduce((sum, s) => sum + (s.total || 0), 0)
  
  totalManual += manualTotal
  totalBD += dbTotal
  
  if (manual.length === 0 && dbDay.length === 0) {
    console.log(`✅ ${dateKey}: Sin ventas (coincide)`)
  } else if (manual.length === 0 && dbDay.length > 0) {
    console.log(`⚠️  ${dateKey}: Hay ${dbDay.length} venta(s) en BD pero no en registro manual`)
    console.log(`   Total BD: $${dbTotal.toLocaleString('es-CO')}`)
    dbDay.forEach(s => {
      ventasSobrantes.push({ date: dateKey, sale: s })
    })
  } else if (manual.length > 0 && dbDay.length === 0) {
    console.log(`❌ ${dateKey}: FALTAN ${manual.length} venta(s) en BD`)
    console.log(`   Total manual: $${manualTotal.toLocaleString('es-CO')}`)
    manual.forEach(m => {
      ventasFaltantes.push({ date: dateKey, manual: m })
    })
  } else {
    const diff = manualTotal - dbTotal
    if (Math.abs(diff) < 100) {
      console.log(`✅ ${dateKey}: Coincide (${manual.length} ventas) - $${manualTotal.toLocaleString('es-CO')}`)
    } else {
      console.log(`⚠️  ${dateKey}: Diferencia de $${diff.toLocaleString('es-CO')}`)
      console.log(`   Manual: $${manualTotal.toLocaleString('es-CO')} (${manual.length} ventas)`)
      console.log(`   BD: $${dbTotal.toLocaleString('es-CO')} (${dbDay.length} ventas)`)
      
      // Detallar diferencias
      if (manual.length !== dbDay.length) {
        console.log(`   ⚠️  Cantidad de ventas no coincide: Manual=${manual.length}, BD=${dbDay.length}`)
      }
    }
  }
})

console.log('\n' + '═'.repeat(80))
console.log('\n📈 RESUMEN:\n')
console.log(`Total registro manual: $${totalManual.toLocaleString('es-CO')}`)
console.log(`Total base de datos: $${totalBD.toLocaleString('es-CO')}`)
console.log(`Diferencia: $${(totalManual - totalBD).toLocaleString('es-CO')}`)
console.log(`\nVentas faltantes en BD: ${ventasFaltantes.length}`)
console.log(`Ventas sobrantes en BD: ${ventasSobrantes.length}`)

if (ventasFaltantes.length > 0) {
  console.log('\n🔴 VENTAS FALTANTES:\n')
  ventasFaltantes.forEach((v, i) => {
    console.log(`${i+1}. ${v.date}: ${v.manual.desc} - $${v.manual.total.toLocaleString('es-CO')}`)
  })
}

if (ventasSobrantes.length > 0) {
  console.log('\n🟡 VENTAS SOBRANTES EN BD:\n')
  ventasSobrantes.forEach((v, i) => {
    const items = JSON.parse(v.sale.items)
    console.log(`${i+1}. ${v.date}: $${v.sale.total.toLocaleString('es-CO')}`)
    console.log(`   Items: ${items.map(it => `${it.productName} x${it.quantity}`).join(', ')}`)
    console.log(`   Notas: ${v.sale.notes || 'N/A'}`)
  })
}

console.log('\n' + '═'.repeat(80))
console.log('\n✅ Análisis completado\n')

db.close()
