const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(__dirname, '../data/inventory.json');

// Leer inventario actual
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

// Productos comprados en Patty - algunos son actualizaciones de cantidad, otros son nuevos
const pattyItems = [
  // LICORES - Actualizar cantidad de Ron Viejo de Caldas
  {
    name: 'Ron Viejo de Caldas Tradicional',
    category: 'licores',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 51900,
    totalValue: 51900,
    code: 'LIC-RON-VC',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'update' // Actualizar cantidad existente
  },
  
  // SIROPES Y BASES - Actualizar cantidades
  {
    name: 'Soda Bretaña 1500 ml',
    category: 'siropes y bases',
    quantity: 2,
    unit: 'Botella',
    unitPrice: 3800,
    totalValue: 7600,
    code: 'REF-BRE-1500',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'update'
  },
  {
    name: 'Salsa mayonesa Bary doy pack',
    category: 'siropes y bases',
    quantity: 1,
    unit: 'Pack',
    unitPrice: 4400,
    totalValue: 4400,
    code: 'COND-MAY-001',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'update'
  },
  {
    name: 'Salsa de tomate Bary doy pack',
    category: 'siropes y bases',
    quantity: 1,
    unit: 'Pack',
    unitPrice: 4100,
    totalValue: 4100,
    code: 'COND-TOM-001',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'update'
  },
  {
    name: 'Mostaneza Rancho La Constancia',
    category: 'siropes y bases',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 6900,
    totalValue: 6900,
    code: 'COND-MOS-001',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'update'
  },
  {
    name: 'Mezclador El Sol Dahu ZZI',
    category: 'siropes y bases',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 4900,
    totalValue: 4900,
    code: 'MEZ-ELS-001',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'update'
  },
  
  // PRODUCTOS DE LIMPIEZA - Actualizar cantidades
  {
    name: 'Toallas higiénicas Kotex x10',
    category: 'productos de limpieza',
    quantity: 1,
    unit: 'Paquete',
    unitPrice: 3950,
    totalValue: 3950,
    code: 'ASE-KOT-001',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'update'
  },
  {
    name: 'Cinta aislante Tesa',
    category: 'productos de limpieza',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 3800,
    totalValue: 3800,
    code: 'UT-CIN-001',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'update'
  },
  
  // DESECHABLES - Nuevo producto (diferente nombre)
  {
    name: 'Tapas para vaso 6 oz bebida caliente',
    category: 'desechables',
    quantity: 1,
    unit: 'Pack',
    unitPrice: 4600,
    totalValue: 4600,
    code: 'DES-TAP-6OZ-HOT',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'add'
  },
  
  // ACOMPAÑANTES - Actualizar cantidad
  {
    name: 'Festival palillos doble',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Paquete',
    unitPrice: 2100,
    totalValue: 2100,
    code: 'PAN-PAL-001',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'update'
  },
  
  // ACTIVOS - Actualizar cantidad
  {
    name: 'Caja de Carioca grande 380 ml',
    category: 'activos',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 115000,
    totalValue: 115000,
    code: 'MB-CAR-001',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'update'
  },
  
  // PRODUCTOS REGULADOS - Nueva categoría
  {
    name: 'Marlboro rojo x20',
    category: 'productos regulados',
    quantity: 1,
    unit: 'Cajetilla',
    unitPrice: 13700,
    totalValue: 13700,
    code: 'TAB-MAR-ROJ',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'add',
    notes: 'Producto regulado - Control aparte'
  },
  {
    name: 'Marlboro rojo verde x20',
    category: 'productos regulados',
    quantity: 5,
    unit: 'Cajetilla',
    unitPrice: 14400,
    totalValue: 72000,
    code: 'TAB-MAR-VER',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'add',
    notes: 'Producto regulado - Control aparte'
  },
  {
    name: 'Marlboro morado azul x20',
    category: 'productos regulados',
    quantity: 4,
    unit: 'Cajetilla',
    unitPrice: 14400,
    totalValue: 57600,
    code: 'TAB-MAR-AZU',
    purchaseDate: '2026-01-03',
    supplier: 'Patty',
    action: 'add',
    notes: 'Producto regulado - Control aparte'
  }
];

console.log('Procesando compras de Patty...\n');

let updated = 0;
let added = 0;

pattyItems.forEach(newItem => {
  if (newItem.action === 'update') {
    // Buscar producto existente por código o nombre
    const existingIndex = inventory.findIndex(item => 
      item.code === newItem.code || 
      (item.name.toLowerCase().includes(newItem.name.toLowerCase()) && 
       item.category === newItem.category)
    );
    
    if (existingIndex !== -1) {
      // Actualizar cantidad sumando la nueva compra
      const existing = inventory[existingIndex];
      const newQuantity = existing.quantity + newItem.quantity;
      const newTotalValue = existing.totalValue + newItem.totalValue;
      
      // Actualizar precio unitario promedio si es diferente
      const avgUnitPrice = newTotalValue / newQuantity;
      
      inventory[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        totalValue: newTotalValue,
        unitPrice: avgUnitPrice,
        supplier: newItem.supplier || existing.supplier,
        purchaseDate: newItem.purchaseDate,
        notes: existing.notes ? `${existing.notes} | Compra Patty ${newItem.purchaseDate}` : `Compra Patty ${newItem.purchaseDate}`
      };
      
      console.log(`Actualizado: ${existing.name} - Cantidad: ${existing.quantity} → ${newQuantity}`);
      updated++;
    } else {
      // Si no existe, agregar como nuevo
      const newInventoryItem = {
        ...newItem,
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      delete newInventoryItem.action;
      inventory.push(newInventoryItem);
      console.log(`Agregado (no encontrado): ${newItem.name}`);
      added++;
    }
  } else {
    // Agregar nuevo producto
    const newInventoryItem = {
      ...newItem,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    delete newInventoryItem.action;
    inventory.push(newInventoryItem);
    console.log(`Agregado: ${newItem.name}`);
    added++;
  }
});

// Guardar inventario actualizado
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));

console.log(`\n✓ Actualizados ${updated} productos (cantidades sumadas)`);
console.log(`✓ Agregados ${added} nuevos productos`);
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

