const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(__dirname, '../data/inventory.json');

// Leer inventario
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

// Mapeo manual de productos a categorías correctas
const categoryMapping = {
  // LICORES - Cervezas y botellas completas
  'CE-001': 'licores', // Poker latas
  'CE-002': 'licores', // Poker latones
  'CE-003': 'licores', // Águila lata
  'CE-004': 'licores', // Águila latón
  'CE-005': 'licores', // Club Colombia Trigo
  'CE-006': 'licores', // Four Loko
  'CAM-MIL': 'licores', // Aperitivo Campari Milano
  'WHI-DD': 'licores', // Whisky Duggan's Dew
  'VIN-CV': 'licores', // Vino tinto Cata Vieja
  'VOD-SMI-TAM': 'licores', // Smirnoff Tamarindo
  'VIN-CRU': 'licores', // Vino Cruzares
  'VIN-SE': 'licores', // Vino Santa Elena
  
  // LICORES PARA SHOTS - Botellas parciales o aguardiente
  'TEQ-OLM': 'licores para shots', // Tequila Olmeca Blanco (1 botella - para shots)
  'GIN-GOR': 'licores para shots', // Ginebra Gordon's (1 botella - para shots)
  'VOD-MOS': 'licores para shots', // Vodka Moskovskaya (1 botella - para shots)
  'AGU-EST': 'licores para shots', // Aguardiente
  'TEQ-1800': 'licores para shots', // Tequila 1800 (0.4 botella)
  'CHA-ART': 'licores para shots', // Chapil artesanal (0.3 botella)
  'WHI-SS': 'licores para shots', // Whisky Something Special (0.3 botella)
  'COÑ-DOM': 'licores para shots', // Coñac Domecq (0.15 botella)
  'TEQ-JC': 'licores para shots', // José Cuervo Tequila (0.25 botella)
  'WHI-OP': 'licores para shots', // Whisky Old Par (0.25 botella)
  'AGU-NAR': 'licores para shots', // Aguardiente Nariño (3 botellas - para shots)
  
  // SIROPES Y BASES
  'SYR-001': 'siropes y bases', // Sirope arándanos
  'BASE-001': 'siropes y bases', // Base cóctel Brissart granadina
  'BASE-002': 'siropes y bases', // Base cóctel Brissart maracuyá
  'SYR-002': 'siropes y bases', // Syrup Finest Call Blue Curacao
  'BASE-003': 'siropes y bases', // Base cóctel Finest Call Triple Sec
  'REF-001': 'siropes y bases', // Bretaña personal x6
  'REF-002': 'siropes y bases', // Bretaña
  'COND-001': 'siropes y bases', // Tajín
  'HIE-001': 'siropes y bases', // Hielo bolsa
  
  // PRODUCTOS DE LIMPIEZA
  'LIM-001': 'productos de limpieza', // Limpión microfibra carros
  'LIM-002': 'productos de limpieza', // Jabón de loza
  'ASE-001': 'productos de limpieza', // Desodorante Speed Stick Ultra Gel
  'LIM-003': 'productos de limpieza', // Trapeador
  'LIM-004': 'productos de limpieza', // Escoba
  'LIM-005': 'productos de limpieza', // Recogedor
  'INS-001': 'productos de limpieza', // Papel toalla Scott
  'INS-002': 'productos de limpieza', // Servilletas
  'DES-PH01': 'productos de limpieza', // Papel Higiénico
  
  // INSUMOS PARA CAFÉ
  'CAF-001': 'insumos para café', // Café Sello Rojo
  'CAF-002': 'insumos para café', // Café Instantáneo
  'LEC-ALS-1L': 'insumos para café', // Leche Alquería semidescremada
  'INS-001': 'insumos para café', // Azúcar (nota: puede haber duplicado con papel toalla)
  'INS-002': 'insumos para café', // Aromáticas (nota: puede haber duplicado)
  'UTEN-001': 'insumos para café', // Bolsa para colar café
  
  // DESECHABLES
  'DES-CI20': 'desechables', // Caja de Icopor
  'DES-VI20': 'desechables', // Vaso de Icopor
  'DES-VP40': 'desechables', // Vaso de Papel
  'DES-CDP60': 'desechables', // Copa Desechable Pequeña
  'DES-PAL180': 'desechables', // Palillos
  'DES-TV6OZ50': 'desechables', // Tapa para Vaso
  
  // ACOMPAÑANTES
  'PAN-001': 'acompañantes', // Ponqué Ramo
};

// Función para categorizar por nombre también (para productos sin código o códigos no listados)
function getCategoryByName(item) {
  const name = item.name.toLowerCase();
  
  // Acompañantes (panadería)
  if (name.includes('ponqué') || name.includes('ponque') || name.includes('pan')) {
    return 'acompañantes';
  }
  
  // Azúcar y aromáticas - insumos para café
  if ((name.includes('azúcar') || name.includes('azucar')) && !name.includes('papel')) {
    return 'insumos para café';
  }
  if (name.includes('aromáticas') || name.includes('aromaticas')) {
    return 'insumos para café';
  }
  
  // Servilletas - limpieza
  if (name.includes('servilletas')) {
    return 'productos de limpieza';
  }
  
  // Papel higiénico - limpieza
  if (name.includes('papel higiénico') || name.includes('papel higienico')) {
    return 'productos de limpieza';
  }
  
  return null;
}

console.log('Reorganizando categorías del inventario...\n');

let updated = 0;
const updates = [];

inventory.forEach(item => {
  let newCategory = null;
  
  // Primero intentar por código
  if (item.code && categoryMapping[item.code]) {
    newCategory = categoryMapping[item.code];
  } else {
    // Si no hay código o no está en el mapeo, intentar por nombre
    newCategory = getCategoryByName(item);
  }
  
  // Si se encontró nueva categoría y es diferente a la actual, actualizar
  if (newCategory && item.category !== newCategory) {
    const oldCategory = item.category;
    item.category = newCategory;
    updated++;
    updates.push({
      name: item.name,
      code: item.code || 'sin código',
      old: oldCategory,
      new: newCategory
    });
  }
});

// Guardar inventario actualizado
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));

console.log(`✓ Actualizados ${updated} productos\n`);

if (updates.length > 0) {
  console.log('Cambios realizados:');
  updates.forEach(update => {
    console.log(`  ${update.name} (${update.code}): ${update.old} → ${update.new}`);
  });
  console.log('');
}

// Mostrar resumen final
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

console.log('Resumen final por categoría:');
categories.forEach(cat => {
  const items = inventory.filter(item => item.category === cat);
  const total = items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
  console.log(`  ${cat}: ${items.length} items - $${total.toLocaleString('es-CO')}`);
});

console.log('\n✓ Reorganización completada!');

