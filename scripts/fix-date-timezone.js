/**
 * Script para corregir fechas que no fueron guardadas correctamente en UTC
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

console.log('\n🔧 Corrigiendo fechas con problemas de zona horaria...\n')

// Buscar ventas del 17 de enero que puedan tener fecha incorrecta
const sales = db.prepare("SELECT id, date, hour FROM sales WHERE date >= '2026-01-17' AND date < '2026-01-19' ORDER BY date DESC").all()

sales.forEach(sale => {
  const d = new Date(sale.date)
  const utcHour = d.getUTCHours()
  const localHour = d.getHours()
  
  // Si la hora UTC es igual a la hora local y la hora guardada (sale.hour) es diferente,
  // significa que la fecha no se guardó correctamente en UTC
  if (sale.hour && utcHour === localHour && utcHour === sale.hour) {
    // Probablemente se guardó como si fuera UTC cuando debería haberse convertido
    // Si sale.hour es 20 (8pm), debería estar guardado como UTC+5 (1am del día siguiente)
    // si estamos en UTC-5 (Colombia)
    
    // Reconstruir la fecha correcta: hora local deseada en zona horaria local
    const dateStr = sale.date.match(/^(\d{4})-(\d{2})-(\d{2})T/)[0].replace('T', '')
    const [year, month, day] = dateStr.split('-').map(Number)
    
    // Crear fecha con hora local (asumiendo UTC-5 para Colombia)
    // Si sale.hour es 20, y está guardado como 2026-01-17T20:00:00Z (que sería UTC),
    // debería ser 2026-01-18T01:00:00Z (UTC) para representar 8pm del 17 en hora local
    const localDate = new Date(year, month - 1, day, sale.hour, 0, 0)
    const correctUTC = localDate.toISOString()
    
    // Solo corregir si la fecha es diferente
    if (correctUTC !== sale.date) {
      console.log(`Corrigiendo venta ${sale.id}:`)
      console.log(`  Fecha anterior: ${sale.date}`)
      console.log(`  Fecha corregida: ${correctUTC}`)
      console.log(`  Hora: ${sale.hour}`)
      
      db.prepare('UPDATE sales SET date = ? WHERE id = ?').run(correctUTC, sale.id)
      console.log('  ✅ Corregida\n')
    }
  }
})

console.log('✅ Verificación completada\n')
db.close()
