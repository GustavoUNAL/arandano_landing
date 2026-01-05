const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(__dirname, '../data/inventory.json');

// Leer inventario actual
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

// Nuevos productos a agregar
const newItems = [
  // LICORES
  {
    name: 'Ron Viejo de Caldas Tradicional',
    category: 'licores',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 51900,
    totalValue: 51900,
    code: 'LIC-RON-VC',
    purchaseDate: '2026-01-03'
  },
  
  // LICORES PARA SHOTS
  {
    name: 'Cerveza Heineken',
    category: 'licores para shots',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 19200,
    totalValue: 19200,
    code: 'CE-HEI-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Cerveza Coronita',
    category: 'licores para shots',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 22200,
    totalValue: 22200,
    code: 'CE-COR-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Cerveza Budweiser',
    category: 'licores para shots',
    quantity: 4,
    unit: 'Botella',
    unitPrice: 18000,
    totalValue: 72000,
    code: 'CE-BUD-001',
    purchaseDate: '2026-01-03'
  },
  
  // SIROPES Y BASES
  {
    name: 'Soda Bretaña 1500 ml',
    category: 'siropes y bases',
    quantity: 2,
    unit: 'Botella',
    unitPrice: 3800,
    totalValue: 7600,
    code: 'REF-BRE-1500',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Mezclador El Sol Dahu ZZI',
    category: 'siropes y bases',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 4900,
    totalValue: 4900,
    code: 'MEZ-ELS-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Salsa mayonesa Bary doy pack',
    category: 'siropes y bases',
    quantity: 1,
    unit: 'Pack',
    unitPrice: 4400,
    totalValue: 4400,
    code: 'COND-MAY-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Salsa de tomate Bary doy pack',
    category: 'siropes y bases',
    quantity: 1,
    unit: 'Pack',
    unitPrice: 4100,
    totalValue: 4100,
    code: 'COND-TOM-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Mostaneza Rancho La Constancia',
    category: 'siropes y bases',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 6900,
    totalValue: 6900,
    code: 'COND-MOS-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Mezcla de ají',
    category: 'siropes y bases',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 5350,
    totalValue: 5350,
    code: 'COND-AJI-001',
    purchaseDate: '2026-01-03'
  },
  
  // PRODUCTOS DE LIMPIEZA
  {
    name: 'Toallas higiénicas Kotex x10',
    category: 'productos de limpieza',
    quantity: 1,
    unit: 'Paquete',
    unitPrice: 3950,
    totalValue: 3950,
    code: 'ASE-KOT-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Cinta aislante Tesa',
    category: 'productos de limpieza',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 3800,
    totalValue: 3800,
    code: 'UT-CIN-001',
    purchaseDate: '2026-01-03'
  },
  
  // INSUMOS PARA CAFÉ
  {
    name: 'Queso Colanta',
    category: 'insumos para café',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 11180,
    totalValue: 11180,
    code: 'INS-QUE-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Jamón Cuisine',
    category: 'insumos para café',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 19990,
    totalValue: 19990,
    code: 'INS-JAM-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Arándanos',
    category: 'insumos para café',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 25980,
    totalValue: 25980,
    code: 'INS-ARA-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Lechuga batavia',
    category: 'insumos para café',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 2084,
    totalValue: 2084,
    code: 'INS-LEC-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Tomate chonto',
    category: 'insumos para café',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 2668,
    totalValue: 2668,
    code: 'INS-TOM-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Baguette CUI',
    category: 'insumos para café',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 12500,
    totalValue: 12500,
    code: 'INS-BAG-001',
    purchaseDate: '2026-01-03'
  },
  
  // DESECHABLES
  {
    name: 'Tapas para vaso 6 oz',
    category: 'desechables',
    quantity: 1,
    unit: 'Pack',
    unitPrice: 4600,
    totalValue: 4600,
    code: 'DES-TAP-6OZ',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Bolsa plástica (ICBP)',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 70,
    totalValue: 70,
    code: 'DES-BOL-001',
    purchaseDate: '2026-01-03'
  },
  
  // ACOMPAÑANTES
  {
    name: 'Festival palillos doble',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Paquete',
    unitPrice: 2100,
    totalValue: 2100,
    code: 'PAN-PAL-001',
    purchaseDate: '2026-01-03'
  },
  {
    name: 'Ponqué Ramo',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 18590,
    totalValue: 18590,
    code: 'PAN-001',
    purchaseDate: '2026-01-03',
    notes: 'Actualización de precio'
  },
  {
    name: 'Sal Refisal',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 15790,
    totalValue: 15790,
    code: 'INS-SAL-001',
    purchaseDate: '2026-01-03'
  },
  
  // ACTIVOS
  {
    name: 'Caja de Carioca grande 380 ml',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 115000,
    totalValue: 115000,
    code: 'MB-CAR-001',
    purchaseDate: '2026-01-03'
  }
];

console.log('Agregando nuevos productos al inventario...\n');

let added = 0;
let updated = 0;

newItems.forEach(newItem => {
  // Verificar si ya existe un producto con el mismo código
  const existingIndex = inventory.findIndex(item => item.code === newItem.code);
  
  if (existingIndex !== -1) {
    // Si existe, actualizar (especialmente para Ponqué Ramo que ya existe)
    console.log(`Actualizando: ${newItem.name} (${newItem.code})`);
    inventory[existingIndex] = {
      ...inventory[existingIndex],
      ...newItem,
      id: inventory[existingIndex].id // Mantener el ID original
    };
    updated++;
  } else {
    // Si no existe, agregar nuevo
    const newInventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    inventory.push(newInventoryItem);
    console.log(`Agregando: ${newItem.name} (${newItem.code})`);
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
  'activos'
];

console.log('\nResumen por categoría:');
categories.forEach(cat => {
  const items = inventory.filter(item => item.category === cat);
  const total = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  console.log(`  ${cat}: ${items.length} items - $${total.toLocaleString('es-CO')}`);
});

console.log('\n✓ Inventario actualizado exitosamente!');

