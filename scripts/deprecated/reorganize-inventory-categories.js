const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(__dirname, '../data/inventory.json');

// Leer inventario
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

// Función para determinar nueva categoría basada en el nombre del producto
function getNewCategory(item) {
  const name = item.name.toLowerCase();
  const category = item.category;
  const quantity = item.quantity;
  const unit = item.unit;

  // Activos - se mantienen igual
  if (category === 'Activos') {
    return 'activos';
  }

  // Productos de limpieza - se mantienen igual
  if (category === 'Limpieza') {
    return 'productos de limpieza';
  }

  // Licores para shots - botellas parciales (< 1) o que se usan principalmente para shots
  const licoresParaShots = [
    'aguardiente',
    'tequila olmeca',
    'ginebra gordon',
    'vodka moskovskaya',
    'whisky old par',
    'tequila 1800',
    'chapil artesanal',
    'whisky something special',
    'coñac domecq',
    'josé cuervo tequila',
    'aguardiente nariño'
  ];
  
  const esLicorParaShot = licoresParaShots.some(licor => name.includes(licor));
  
  // Licores - botellas completas o casi completas (quantity >= 0.8) que no sean para shots
  const licoresCompletos = [
    'aperitivo campari',
    'whisky duggan',
    'smirnoff tamarindo',
    'vino tinto cata vieja',
    'vino cruzares',
    'vino santa elena'
  ];
  
  const esLicorCompleto = licoresCompletos.some(licor => name.includes(licor)) || 
                         (category === 'Bebidas' && !esLicorParaShot && quantity >= 0.8);
  
  if (category === 'Bebidas') {
    if (esLicorParaShot || quantity < 0.8) {
      return 'licores para shots';
    } else if (esLicorCompleto || name.includes('vino') || name.includes('botella')) {
      return 'licores';
    } else {
      // Cervezas y otras bebidas se mantienen como licores (para simplificar)
      return 'licores';
    }
  }

  // Siropes y bases
  if (name.includes('sirope') || name.includes('syrup') || 
      name.includes('base cóctel') || name.includes('base coctel') ||
      name.includes('bretaña') || name.includes('tajín') || name.includes('hielo')) {
    return 'siropes y bases';
  }

  // Insumos para café
  if (name.includes('café') || name.includes('cafe') || 
      name.includes('azúcar') || name.includes('azucar') ||
      name.includes('leche') || name.includes('aromáticas') ||
      name.includes('aromaticas') || name.includes('bolsa para colar')) {
    return 'insumos para café';
  }

  // Desechables
  if (name.includes('icopor') || name.includes('papel') || 
      name.includes('vaso de') || name.includes('copa desechable') ||
      name.includes('palillos') || name.includes('tapa para vaso') ||
      name.includes('desechable')) {
    return 'desechables';
  }

  // Acompañantes (panadería)
  if (name.includes('ponqué') || name.includes('ponque') ||
      name.includes('pan') || name.includes('pastel') ||
      category === 'Insumos') {
    // Si es un insumo que no es para café ni sirope, probablemente es panadería
    return 'acompañantes';
  }

  // Por defecto, mantener la categoría original pero en minúsculas
  return category.toLowerCase();
}

console.log('Reorganizando categorías del inventario...\n');

const categoryMapping = {};
let updated = 0;

inventory.forEach(item => {
  const oldCategory = item.category;
  const newCategory = getNewCategory(item);
  
  if (oldCategory !== newCategory) {
    item.category = newCategory;
    updated++;
    
    if (!categoryMapping[oldCategory]) {
      categoryMapping[oldCategory] = {};
    }
    if (!categoryMapping[oldCategory][newCategory]) {
      categoryMapping[oldCategory][newCategory] = 0;
    }
    categoryMapping[oldCategory][newCategory]++;
  }
});

// Guardar inventario actualizado
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));

console.log(`✓ Actualizados ${updated} items\n`);

// Mostrar resumen de categorías
const newCategories = [...new Set(inventory.map(item => item.category))];
console.log('Nuevas categorías:');
newCategories.forEach(cat => {
  const count = inventory.filter(item => item.category === cat).length;
  console.log(`  - ${cat}: ${count} items`);
});

console.log('\nResumen de cambios:');
Object.keys(categoryMapping).forEach(oldCat => {
  console.log(`\n${oldCat} →`);
  Object.keys(categoryMapping[oldCat]).forEach(newCat => {
    console.log(`  ${newCat}: ${categoryMapping[oldCat][newCat]} items`);
  });
});

console.log('\n✓ Reorganización completada!');

