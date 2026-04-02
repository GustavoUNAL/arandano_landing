/**
 * Prueba rápida de acceso a datos (getProducts, inventario, ventas, tareas).
 * Uso: npm run test:api  (requiere .env.local y data según DB_MODE)
 */

require('./load-env-local.cjs');

async function testFunctions() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Prueba de funciones de base de datos');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`DB_MODE: ${process.env.DB_MODE || 'no configurado'}\n`);

  try {
    console.log('1. getProducts()...');
    const { getProducts } = require('../lib/db-products');
    const products = await getProducts();
    console.log(`   OK: ${products.length} productos\n`);
  } catch (error) {
    console.error(`   Error: ${error.message}\n`);
  }

  try {
    console.log('2. getInventory()...');
    const { getInventory } = require('../lib/db-inventory');
    const inventory = await getInventory();
    console.log(`   OK: ${inventory.length} items\n`);
  } catch (error) {
    console.error(`   Error: ${error.message}\n`);
  }

  try {
    console.log('3. getSales()...');
    const { getSales } = require('../lib/db-sales');
    const sales = await getSales();
    console.log(`   OK: ${sales.length} ventas\n`);
  } catch (error) {
    console.error(`   Error: ${error.message}\n`);
  }

  try {
    console.log('4. getTasks()...');
    const { getTasks } = require('../lib/db-tasks');
    const tasks = await getTasks();
    console.log(`   OK: ${tasks.length} tareas\n`);
  } catch (error) {
    console.error(`   Error: ${error.message}\n`);
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Fin');
  console.log('═══════════════════════════════════════════════════════════\n');
}

testFunctions().catch((error) => {
  console.error('\nError fatal:', error);
  process.exit(1);
});
