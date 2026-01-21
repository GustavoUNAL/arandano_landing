/**
 * Script para probar las funciones de DB directamente
 * Uso: node scripts/test-api-functions.js
 */

require('dotenv').config({ path: '.env.local' })

async function testFunctions() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🧪 PRUEBA DE FUNCIONES DE BASE DE DATOS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`DB_MODE: ${process.env.DB_MODE || 'no configurado'}\n`);
  
  // Probar productos
  try {
    console.log('1️⃣  Probando getProducts()...');
    const { getProducts } = require('../lib/db-products')
    const products = await getProducts()
    console.log(`   ✅ Éxito: ${products.length} productos encontrados\n`)
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    console.error(`   Stack: ${error.stack}\n`)
  }
  
  // Probar inventario
  try {
    console.log('2️⃣  Probando getInventory()...');
    const { getInventory } = require('../lib/db-inventory')
    const inventory = await getInventory()
    console.log(`   ✅ Éxito: ${inventory.length} items encontrados\n`)
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    console.error(`   Stack: ${error.stack}\n`)
  }
  
  // Probar ventas
  try {
    console.log('3️⃣  Probando getSales()...');
    const { getSales } = require('../lib/db-sales')
    const sales = await getSales()
    console.log(`   ✅ Éxito: ${sales.length} ventas encontradas\n`)
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    console.error(`   Stack: ${error.stack}\n`)
  }
  
  // Probar tareas
  try {
    console.log('4️⃣  Probando getTasks()...');
    const { getTasks } = require('../lib/db-tasks')
    const tasks = await getTasks()
    console.log(`   ✅ Éxito: ${tasks.length} tareas encontradas\n`)
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    console.error(`   Stack: ${error.stack}\n`)
  }
  
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ✅ Pruebas completadas')
  console.log('═══════════════════════════════════════════════════════════\n')
}

testFunctions().catch(error => {
  console.error('\n❌ Error fatal:', error)
  process.exit(1)
})

