/**
 * Actualiza nombres de productos y recetas según la lista mejorada del usuario.
 * Usa inventario existente para mapear ingredientes (sin "Agua" - no se controla en inventario).
 */

const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)

// IDs de inventario usados (nombres actuales en DB)
const INV = {
  cafe: 'inv-1768953803936-gz1gyesjb',       // Café Sello Rojo (gr)
  azucar: 'inv-1767483353926-tgjwb0599',      // Azúcar (Bolsa -> gr en receta)
  aromaticas: 'inv-1767483353926-wdcg82vjf', // Aromáticas (Unidad)
  leche: 'inv-1767483353917-ser4dw1e8',       // Leche Alquería semidescremada
  hielo: 'inv-1767483353913-1889mnu82',       // Hielo bolsa
  whisky: 'inv-1767483353908-y3b53io8x',     // Whisky Duggan's Dew
  aguardiente: 'inv-1767483353908-agu-nar',   // Aguardiente Nariño
  campari: 'inv-1767483353908-u55v6zs0u',     // Aperitivo Campari Milano
  vodka: 'inv-1767483353908-dlloi6yve',       // Vodka Moskovskaya
  tequila: 'inv-1767483353908-y9q9alloi',     // Tequila Olmeca Blanco
  tripleSec: 'inv-1767483353913-jb8887h9r',   // Base cóctel Finest Call Triple Sec
  soda: 'inv-1767483353913-kkkqg7bwc',       // Bretaña personal x6
  siropeArandano: 'inv-1767483353913-4i345h1fq', // Sirope arándanos
  vinoTinto: 'inv-1767483353908-yecytqq00',   // Vino tinto Cata Vieja
  frutasHervido: 'inv-1767636242812-x85xirex1',  // Frutas para hervidos (Libra)
}

const NAMES = {
  cafe: 'Café molido o instantáneo',
  azucar: 'Azúcar',
  aromaticas: 'Canela/vainilla (Aromáticas)',
  leche: 'Leche',
  hielo: 'Hielo',
  whisky: 'Whisky',
  aguardiente: 'Aguardiente',
  campari: 'Campari',
  vodka: 'Vodka',
  tequila: 'Tequila',
  tripleSec: 'Triple sec',
  soda: 'Soda o agua con gas',
  siropeArandano: 'Sirope de arándano',
  vinoTinto: 'Vino tinto',
  frutasHervido: 'Fruta para hervido',
}

// 1) Actualizar nombres de productos
const productUpdates = [
  { id: 'cafe-aromatizado', name: 'Café aromatizado artesanal (canela o vainilla)' },
  { id: 'cafe-leche', name: 'Café artesanal con leche' },
  { id: 'cafe-negro', name: 'Café negro artesanal' },
  { id: 'cafe-irlandes', name: 'Café irlandés' },
  { id: 'carajillo', name: 'Carajillo' },
  { id: 'vaso-leche', name: 'Vaso de leche caliente' },
  { id: 'cafe-frio', name: 'Café frío artesanal' },
  { id: 'cafe-frio-leche', name: 'Café frío artesanal con leche' },
  { id: 'cafe-helado', name: 'Café helado artesanal (tipo affogato)' },
  { id: 'bebida-1767479422734-8ofoa07j2', name: 'Cóctel de soda sin licor' },
  { id: 'coctel-arandano', name: 'Cóctel de arándano' },
  { id: 'bebida-1767478463497-c2aya0ta0', name: 'Cóctel de Campari' },
  { id: 'bebida-1767478306369-c8s8nr6nh', name: 'Cóctel Moscow Mule (versión práctica)' },
  { id: 'bebida-1767479680271-wp5qa9j7m', name: 'Margarita' },
  { id: 'bebida-1767479537737-5pcmv20sn', name: 'Hervido de fruta de temporada' },
  { id: 'vino-caliente', name: 'Vino caliente' },
]

const updateProduct = db.prepare('UPDATE products SET name = ?, updatedAt = ? WHERE id = ?')
const now = new Date().toISOString()

console.log('Actualizando nombres de productos...')
productUpdates.forEach(({ id, name }) => {
  updateProduct.run(name.trim(), now, id)
  console.log('  ', id, '->', name.trim())
})

// 2) Actualizar recetas (productName + ingredients)
// Mapeo recipeId -> { productName, ingredients[] }
const recipeIdByProductId = {}
db.prepare('SELECT id, productId, productName FROM recipes').all().forEach(r => {
  recipeIdByProductId[r.productId] = { id: r.id, productName: r.productName }
})

function ing(pid, pname, qty, unit) {
  return { productId: pid, productName: pname, quantity: qty, unit }
}

const recipesByProductId = {
  'cafe-aromatizado': {
    productName: 'Café aromatizado artesanal (canela o vainilla)',
    ingredients: [
      ing(INV.cafe, NAMES.cafe, 10, 'gr'),
      ing(INV.aromaticas, NAMES.aromaticas, 1, 'unidad'),
      ing(INV.azucar, NAMES.azucar, 10, 'gr'),
    ],
  },
  'cafe-leche': {
    productName: 'Café artesanal con leche',
    ingredients: [
      ing(INV.cafe, NAMES.cafe, 10, 'gr'),
      ing(INV.leche, NAMES.leche, 50, 'ml'),
      ing(INV.azucar, NAMES.azucar, 10, 'gr'),
    ],
  },
  'cafe-negro': {
    productName: 'Café negro artesanal',
    ingredients: [
      ing(INV.cafe, NAMES.cafe, 10, 'gr'),
      ing(INV.azucar, NAMES.azucar, 10, 'gr'),
    ],
  },
  'cafe-irlandes': {
    productName: 'Café irlandés',
    ingredients: [
      ing(INV.cafe, NAMES.cafe, 10, 'gr'),
      ing(INV.whisky, NAMES.whisky, 30, 'ml'),
      ing(INV.leche, NAMES.leche, 30, 'ml'),
      ing(INV.azucar, NAMES.azucar, 10, 'gr'),
    ],
  },
  carajillo: {
    productName: 'Carajillo',
    ingredients: [
      ing(INV.cafe, NAMES.cafe, 10, 'gr'),
      ing(INV.aguardiente, NAMES.aguardiente, 30, 'ml'),
      ing(INV.azucar, NAMES.azucar, 10, 'gr'),
    ],
  },
  'vaso-leche': {
    productName: 'Vaso de leche caliente',
    ingredients: [
      ing(INV.leche, NAMES.leche, 250, 'ml'),
      ing(INV.azucar, NAMES.azucar, 10, 'gr'),
    ],
  },
  'cafe-frio': {
    productName: 'Café frío artesanal',
    ingredients: [
      ing(INV.cafe, NAMES.cafe, 10, 'gr'),
      ing(INV.hielo, 'Hielo', 100, 'gr'),
      ing(INV.azucar, NAMES.azucar, 10, 'gr'),
    ],
  },
  'cafe-frio-leche': {
    productName: 'Café frío artesanal con leche',
    ingredients: [
      ing(INV.cafe, NAMES.cafe, 10, 'gr'),
      ing(INV.leche, NAMES.leche, 50, 'ml'),
      ing(INV.hielo, 'Hielo', 100, 'gr'),
      ing(INV.azucar, NAMES.azucar, 10, 'gr'),
    ],
  },
  'cafe-helado': {
    productName: 'Café helado artesanal (tipo affogato)',
    ingredients: [
      ing(INV.cafe, NAMES.cafe, 10, 'gr'),
      ing(INV.hielo, 'Hielo', 150, 'gr'),
      ing(INV.azucar, NAMES.azucar, 10, 'gr'),
    ],
  },
  'bebida-1767479422734-8ofoa07j2': {
    productName: 'Cóctel de soda sin licor',
    ingredients: [
      ing(INV.soda, NAMES.soda, 200, 'ml'),
      ing(INV.hielo, 'Hielo', 100, 'gr'),
    ],
  },
  'coctel-arandano': {
    productName: 'Cóctel de arándano',
    ingredients: [
      ing(INV.siropeArandano, NAMES.siropeArandano, 30, 'ml'),
      ing(INV.soda, NAMES.soda, 200, 'ml'),
      ing(INV.hielo, 'Hielo', 100, 'gr'),
    ],
  },
  'bebida-1767478463497-c2aya0ta0': {
    productName: 'Cóctel de Campari',
    ingredients: [
      ing(INV.campari, NAMES.campari, 50, 'ml'),
      ing(INV.soda, NAMES.soda, 150, 'ml'),
      ing(INV.hielo, 'Hielo', 100, 'gr'),
    ],
  },
  'bebida-1767478306369-c8s8nr6nh': {
    productName: 'Cóctel Moscow Mule (versión práctica)',
    ingredients: [
      ing(INV.vodka, NAMES.vodka, 45, 'ml'),
      ing(INV.soda, NAMES.soda, 120, 'ml'),
      ing(INV.hielo, 'Hielo', 100, 'gr'),
    ],
  },
  'bebida-1767479680271-wp5qa9j7m': {
    productName: 'Margarita',
    ingredients: [
      ing(INV.tequila, NAMES.tequila, 45, 'ml'),
      ing(INV.tripleSec, NAMES.tripleSec, 20, 'ml'),
      ing(INV.hielo, 'Hielo', 120, 'gr'),
    ],
  },
  'bebida-1767479537737-5pcmv20sn': {
    productName: 'Hervido de fruta de temporada',
    ingredients: [
      ing(INV.frutasHervido, NAMES.frutasHervido, 0.1, 'kg'),  // ~100 g (inventario puede estar en Libra)
      ing(INV.aguardiente, NAMES.aguardiente, 60, 'ml'),
      ing(INV.azucar, NAMES.azucar, 15, 'gr'),
    ],
  },
  'vino-caliente': {
    productName: 'Vino caliente',
    ingredients: [
      ing(INV.vinoTinto, NAMES.vinoTinto, 150, 'ml'),
      ing(INV.azucar, NAMES.azucar, 10, 'gr'),
    ],
  },
}

const updateRecipe = db.prepare('UPDATE recipes SET productName = ?, ingredients = ?, updatedAt = ? WHERE id = ?')

console.log('\nActualizando recetas (ingredientes)...')
for (const [productId, data] of Object.entries(recipesByProductId)) {
  const rec = recipeIdByProductId[productId]
  if (!rec) {
    console.log('  [SKIP] No existe receta para producto:', productId)
    continue
  }
  updateRecipe.run(data.productName, JSON.stringify(data.ingredients), now, rec.id)
  console.log('  ', data.productName)
  data.ingredients.forEach(i => console.log('      -', i.productName, i.quantity, i.unit))
}

db.close()
console.log('\nListo. Productos y recetas actualizados.')
console.log('Nota: "Agua caliente" no se registra en inventario (no se controla en costos).')
console.log('Jugo de limón en Margarita no estaba en inventario; receta usa Tequila + Triple sec + Hielo.')
