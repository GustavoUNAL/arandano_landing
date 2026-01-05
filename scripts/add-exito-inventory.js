const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(__dirname, '../data/inventory.json');

// Leer inventario actual
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

// Calcular fechas
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const todayStr = today.toISOString().split('T')[0];
const yesterdayStr = yesterday.toISOString().split('T')[0];

// Productos comprados en Éxito
const exitoItems = [
  // AYER - Éxito
  {
    name: 'Soda Bretaña',
    category: 'siropes y bases',
    quantity: 36, // 2 pacas × 18 sodas cada una
    unit: 'Unidad',
    unitPrice: 444.44, // 8.000 / 18 = 444.44 por soda
    totalValue: 16000, // 2 pacas × 8.000
    code: 'REF-BRE-EXI',
    purchaseDate: yesterdayStr,
    supplier: 'Éxito',
    notes: '2 pacas de 18 sodas cada una'
  },
  {
    name: 'Cubiertos',
    category: 'activos',
    quantity: 1,
    unit: 'Set',
    unitPrice: 13000,
    totalValue: 13000,
    code: 'UT-CUB-001',
    purchaseDate: yesterdayStr,
    supplier: 'Éxito'
  },
  {
    name: 'Jugo de arándano',
    category: 'siropes y bases',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 15000,
    totalValue: 15000,
    code: 'SYR-ARA-EXI',
    purchaseDate: yesterdayStr,
    supplier: 'Éxito'
  },
  
  // HOY
  {
    name: 'Frutas para hervidos',
    category: 'insumos para café',
    quantity: 2,
    unit: 'Libra',
    unitPrice: 6500, // 13.000 / 2 libras = 6.500 por libra
    totalValue: 13000,
    code: 'INS-FRU-001',
    purchaseDate: todayStr,
    supplier: 'Éxito',
    notes: '2 libras'
  },
  {
    name: 'Recipientes plásticos',
    category: 'activos',
    quantity: 3,
    unit: 'Unidad',
    unitPrice: 2000,
    totalValue: 6000,
    code: 'UT-REC-001',
    purchaseDate: todayStr,
    supplier: 'Éxito'
  }
];

console.log('Agregando productos comprados en Éxito...\n');
console.log(`Fecha de ayer (compras Éxito): ${yesterdayStr}`);
console.log(`Fecha de hoy: ${todayStr}\n`);

let added = 0;
let updated = 0;

exitoItems.forEach(newItem => {
  // Buscar si ya existe un producto similar
  const existingIndex = inventory.findIndex(item => 
    item.code === newItem.code ||
    (item.name.toLowerCase() === newItem.name.toLowerCase() && 
     item.category === newItem.category)
  );
  
  if (existingIndex !== -1) {
    // Si existe, actualizar cantidad sumando
    const existing = inventory[existingIndex];
    const newQuantity = existing.quantity + newItem.quantity;
    const newTotalValue = existing.totalValue + newItem.totalValue;
    const avgUnitPrice = newTotalValue / newQuantity;
    
    inventory[existingIndex] = {
      ...existing,
      quantity: newQuantity,
      totalValue: newTotalValue,
      unitPrice: avgUnitPrice,
      supplier: newItem.supplier || existing.supplier,
      purchaseDate: newItem.purchaseDate,
      notes: existing.notes ? `${existing.notes} | Compra Éxito ${newItem.purchaseDate}` : `Compra Éxito ${newItem.purchaseDate}`
    };
    
    console.log(`Actualizado: ${existing.name} - Cantidad: ${existing.quantity} → ${newQuantity}`);
    updated++;
  } else {
    // Agregar nuevo producto
    const newInventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    inventory.push(newInventoryItem);
    console.log(`Agregado: ${newItem.name} - Cantidad: ${newItem.quantity} - Valor: $${newItem.totalValue.toLocaleString('es-CO')}`);
    added++;
  }
});

// Guardar inventario actualizado
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));

console.log(`\n✓ Agregados ${added} nuevos productos`);
console.log(`✓ Actualizados ${updated} productos existentes`);
console.log(`✓ Total items en inventario: ${inventory.length}`);

// Resumen por categoría
const categories = [
  'licores',
  'licores para shots',
  'siropes y bases',
  'productos de limpieza',
  'insumos para café',
  'desechables',
  'acompañantes',
  'activos',
  'productos regulados'
];

console.log('\nResumen por categoría:');
categories.forEach(cat => {
  const items = inventory.filter(item => item.category === cat);
  if (items.length > 0) {
    const total = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    console.log(`  ${cat}: ${items.length} items - $${total.toLocaleString('es-CO')}`);
  }
});

console.log('\n✓ Inventario actualizado exitosamente!');

