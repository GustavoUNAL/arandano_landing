const fs = require('fs');
const path = require('path');

const inventoryPath = path.join(__dirname, '../data/inventory.json');
const productsPath = path.join(__dirname, '../data/products.json');

// Leer datos
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Función para encontrar item en inventario por nombre (búsqueda flexible)
function findInventoryItem(searchName) {
  return inventory.find(item => 
    item.name.toLowerCase().includes(searchName.toLowerCase()) ||
    searchName.toLowerCase().includes(item.name.toLowerCase())
  );
}

// Función para encontrar todos los items relacionados
function findInventoryItems(searchName) {
  return inventory.filter(item => 
    item.name.toLowerCase().includes(searchName.toLowerCase()) ||
    searchName.toLowerCase().includes(item.name.toLowerCase())
  );
}

// Mapeo manual de productos a inventario
const costMappings = {
  // Cervezas - mapeo directo
  'cerveza-poker-330': () => {
    const item = findInventoryItem('Poker latas');
    return item ? item.unitPrice : null;
  },
  'cerveza-poker-laton': () => {
    const item = findInventoryItem('Poker latones');
    return item ? item.unitPrice : null;
  },
  'cerveza-aguila-330': () => {
    const item = findInventoryItem('Águila lata');
    return item ? item.unitPrice : null;
  },
  'cerveza-club-colombia-330': () => {
    const item = findInventoryItem('Club Colombia Trigo');
    return item ? item.unitPrice : null;
  },
  
  // Leche
  'vaso-leche': () => {
    const item = findInventoryItem('Leche Alquería semidescremada');
    // Leche viene en bolsa de 1L = 1000ml, estimamos 200ml por vaso = 5 vasos por bolsa
    // Costo por vaso = costo de bolsa / 5
    return item ? Math.round(item.unitPrice / 5) : null;
  },
  
  // Cafés - costo aproximado de ingredientes
  'cafe-negro': () => {
    const cafe = findInventoryItem('Café Sello Rojo');
    const azucar = findInventoryItem('Azúcar');
    // Estimamos 20g de café por taza = 50 tazas por paquete de 1kg
    // Café: 16000 / 50 = 320 por taza
    // Azúcar: 5000 / 500 = 10 por taza (estimado 1kg de azúcar = 500 tazas)
    const cafeCost = cafe ? Math.round(cafe.unitPrice / 50) : 320;
    const azucarCost = azucar ? Math.round(azucar.unitPrice / 500) : 10;
    // Agua, gas, etc. - estimado 100
    return cafeCost + azucarCost + 100;
  },
  'cafe-leche': () => {
    const cafe = findInventoryItem('Café Sello Rojo');
    const leche = findInventoryItem('Leche Alquería semidescremada');
    const azucar = findInventoryItem('Azúcar');
    const cafeCost = cafe ? Math.round(cafe.unitPrice / 50) : 320;
    const lecheCost = leche ? Math.round(leche.unitPrice / 5) : 1200;
    const azucarCost = azucar ? Math.round(azucar.unitPrice / 500) : 10;
    return cafeCost + lecheCost + azucarCost + 100;
  },
  'cafe-frio': () => {
    const cafe = findInventoryItem('Café Sello Rojo');
    const azucar = findInventoryItem('Azúcar');
    const cafeCost = cafe ? Math.round(cafe.unitPrice / 50) : 320;
    const azucarCost = azucar ? Math.round(azucar.unitPrice / 500) : 10;
    // Hielo - estimado 200
    return cafeCost + azucarCost + 200;
  },
  'cafe-frio-leche': () => {
    const cafe = findInventoryItem('Café Sello Rojo');
    const leche = findInventoryItem('Leche Alquería semidescremada');
    const azucar = findInventoryItem('Azúcar');
    const cafeCost = cafe ? Math.round(cafe.unitPrice / 50) : 320;
    const lecheCost = leche ? Math.round(leche.unitPrice / 5) : 1200;
    const azucarCost = azucar ? Math.round(azucar.unitPrice / 500) : 10;
    // Hielo - estimado 200
    return cafeCost + lecheCost + azucarCost + 200;
  },
  'cafe-aromatizado': () => {
    const cafe = findInventoryItem('Café Sello Rojo');
    const azucar = findInventoryItem('Azúcar');
    const cafeCost = cafe ? Math.round(cafe.unitPrice / 50) : 320;
    const azucarCost = azucar ? Math.round(azucar.unitPrice / 500) : 10;
    // Esencia - estimado 300
    return cafeCost + azucarCost + 300 + 100;
  },
  'cafe-irlandes': () => {
    const cafe = findInventoryItem('Café Sello Rojo');
    const whisky = findInventoryItem("Whisky Old Par");
    const azucar = findInventoryItem('Azúcar');
    const cafeCost = cafe ? Math.round(cafe.unitPrice / 50) : 320;
    // Si tiene 0.25 botella, unitPrice es el precio de esa cantidad, pero necesitamos precio por botella completa
    // Para shots, calculamos basándonos en que 0.25 botella de 700ml = 175ml = ~6 shots
    // Pero unitPrice ya es el precio total de la botella completa (250000)
    const whiskyCost = whisky ? Math.round(whisky.unitPrice / 23) : 0; // 700ml = 23 shots
    const azucarCost = azucar ? Math.round(azucar.unitPrice / 500) : 10;
    // Crema - estimado 500
    return cafeCost + whiskyCost + azucarCost + 500;
  },
  'carajillo': () => {
    const cafe = findInventoryItem('Café Sello Rojo');
    const aguardiente = findInventoryItem('Aguardiente');
    const cafeCost = cafe ? Math.round(cafe.unitPrice / 50) : 320;
    const aguardienteCost = aguardiente ? Math.round(aguardiente.unitPrice / 25) : 0; // 750ml = 25 shots
    return cafeCost + aguardienteCost + 100;
  },
  
  // Licores - costo por shot (30ml)
  // Una botella de 700ml = ~23 shots, botella de 750ml = ~25 shots
  'tequila-olmeca-shot': () => {
    const item = findInventoryItem('Tequila Olmeca Blanco');
    // 700ml = 23 shots aprox
    return item ? Math.round(item.unitPrice / 23) : null;
  },
  'gin-gordons-shot': () => {
    const item = findInventoryItem("Ginebra Gordon's");
    // 700ml = 23 shots aprox
    return item ? Math.round(item.unitPrice / 23) : null;
  },
  'vodka-moskaya-shot': () => {
    const item = findInventoryItem('Vodka Moskovskaya');
    // 750ml = 25 shots aprox
    return item ? Math.round(item.unitPrice / 25) : null;
  },
  'whisky-old-parr-shot': () => {
    const item = findInventoryItem("Whisky Old Par");
    // unitPrice ya es el precio de la botella completa (250000 según inventario)
    // 700ml = 23 shots aprox
    return item ? Math.round(item.unitPrice / 23) : null;
  },
  
  // Botellas de licor
  'tequila-olmeca-botella': () => {
    const item = findInventoryItem('Tequila Olmeca Blanco');
    return item ? item.unitPrice : null;
  },
  'gin-gordons-botella': () => {
    const item = findInventoryItem("Ginebra Gordon's");
    return item ? item.unitPrice : null;
  },
  
  // Cócteles - calcular costo aproximado de ingredientes
  'bebida-1767478306369-c8s8nr6nh': () => { // Moscow Mule
    // Vodka shot + cerveza + limón + hielo
    const vodka = findInventoryItem('Vodka Moskovskaya');
    const vodkaCost = vodka ? Math.round(vodka.unitPrice / 25) : 0;
    const beer = findInventoryItem('Poker latas');
    const beerCost = beer ? beer.unitPrice : 0;
    // Hielo, limón, jengibre - estimado 500
    return vodkaCost + beerCost + 500;
  },
  'bebida-1767478463497-c2aya0ta0': () => { // Cóctel Campari
    const campari = findInventoryItem('Aperitivo Campari Milano');
    const campariCost = campari ? Math.round(campari.unitPrice / 25) : 0;
    // Jugo de naranja, hielo - estimado 500
    return campariCost + 500;
  },
  'coctel-arandano': () => { // Cóctel Arándano
    const sirope = findInventoryItem('Sirope arándanos');
    const campari = findInventoryItem('Aperitivo Campari Milano');
    // Sirope: 20000 / 1000ml = 20 por ml, estimamos 50ml por cóctel = 1000
    // Campari: 121900 / 25 = 4876 por shot, estimamos 30ml = 4876
    const siropeCost = sirope ? Math.round(sirope.unitPrice / 20) : 1000;
    const campariCost = campari ? Math.round(campari.unitPrice / 25) : 4876;
    // Jugo de naranja, hielo - estimado 500
    return siropeCost + campariCost + 500;
  },
};

console.log('Actualizando costos de productos...\n');

let updated = 0;
const updates = [];

products.forEach(product => {
  let cost = product.cost || null;
  
  // Intentar mapeo directo
  if (costMappings[product.id]) {
    cost = costMappings[product.id]();
  } else {
    // Búsqueda automática por nombre
    const inventoryItem = findInventoryItem(product.name);
    if (inventoryItem) {
      cost = inventoryItem.unitPrice;
    }
  }
  
  // Actualizar costo si se encontró
  if (cost !== null && cost !== undefined && cost > 0) {
    const oldCost = product.cost || 0;
    product.cost = cost;
    
    // Calcular rentabilidad
    const price = product.price || 0;
    const margin = price - cost;
    const marginPercent = price > 0 ? ((margin / price) * 100).toFixed(2) : 0;
    
    updates.push({
      id: product.id,
      name: product.name,
      price: price,
      oldCost: oldCost,
      newCost: cost,
      margin: margin,
      marginPercent: parseFloat(marginPercent)
    });
    
    if (oldCost !== cost) {
      updated++;
    }
  }
});

// Guardar productos actualizados
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

console.log(`✓ Actualizados ${updated} productos con nuevos costos\n`);
console.log('Resumen de rentabilidad:\n');
console.log('─'.repeat(120));
console.log(`${'Producto'.padEnd(40)} ${'Precio'.padStart(10)} ${'Costo'.padStart(10)} ${'Margen'.padStart(10)} ${'Margen %'.padStart(10)}`);
console.log('─'.repeat(120));

updates
  .sort((a, b) => b.marginPercent - a.marginPercent)
  .forEach(update => {
    const marginColor = update.marginPercent > 50 ? '🟢' : update.marginPercent > 30 ? '🟡' : update.marginPercent > 0 ? '🔵' : '🔴';
    console.log(
      `${update.name.substring(0, 38).padEnd(40)} ` +
      `$${update.price.toLocaleString('es-CO').padStart(9)} ` +
      `$${Math.round(update.newCost).toLocaleString('es-CO').padStart(9)} ` +
      `$${Math.round(update.margin).toLocaleString('es-CO').padStart(9)} ` +
      `${marginColor} ${update.marginPercent}%`
    );
  });

console.log('─'.repeat(120));

const totalRevenue = updates.reduce((sum, u) => sum + u.price, 0);
const totalCost = updates.reduce((sum, u) => sum + u.newCost, 0);
const totalMargin = totalRevenue - totalCost;
const avgMarginPercent = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100).toFixed(2) : 0;

console.log(`\nResumen General:`);
console.log(`  Total productos analizados: ${updates.length}`);
console.log(`  Precio promedio: $${Math.round(totalRevenue / updates.length).toLocaleString('es-CO')}`);
console.log(`  Costo promedio: $${Math.round(totalCost / updates.length).toLocaleString('es-CO')}`);
console.log(`  Margen promedio: $${Math.round(totalMargin / updates.length).toLocaleString('es-CO')}`);
console.log(`  Margen promedio porcentual: ${avgMarginPercent}%`);

console.log('\n✓ Costos actualizados exitosamente!');
