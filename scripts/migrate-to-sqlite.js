/**
 * Script para migrar datos de Firebase/JSON a SQLite
 */

const admin = require('firebase-admin')
const path = require('path')
const Database = require('better-sqlite3')

// Inicializar Firebase Admin (si está disponible)
let firebaseInitialized = false
try {
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json')
  if (require('fs').existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
    }
    firebaseInitialized = true
  }
} catch (error) {
  console.warn('Firebase no disponible, usando solo JSON')
}

// Inicializar SQLite
const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Inicializar tablas
function initializeDatabase() {
  // Tabla de productos
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      imageUrl TEXT,
      size TEXT,
      minStock INTEGER,
      cost REAL,
      purchaseDate TEXT,
      lot TEXT,
      supplier TEXT,
      lastSaleDate TEXT,
      totalSold INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    )
  `)

  // Tabla de inventario
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unitPrice REAL NOT NULL,
      totalValue REAL NOT NULL,
      code TEXT,
      purchaseDate TEXT,
      lot TEXT,
      supplier TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `)

  // Tabla de ventas
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      hour INTEGER NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      paymentMethod TEXT,
      notes TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `)

  // Tabla de recetas
  db.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      category TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT
    )
  `)

  // Índices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
    CREATE INDEX IF NOT EXISTS idx_recipes_productId ON recipes(productId);
  `)
}

// Inicializar antes de migrar
initializeDatabase()
console.log('✅ Base de datos inicializada\n')

// Cargar datos JSON como fallback
const productsPath = path.join(__dirname, '..', 'data', 'products.json')
const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.json')
const salesPath = path.join(__dirname, '..', 'data', 'sales.json')

function loadJSON(filePath) {
  try {
    if (require('fs').existsSync(filePath)) {
      return JSON.parse(require('fs').readFileSync(filePath, 'utf8'))
    }
  } catch (error) {
    console.warn(`No se pudo cargar ${filePath}:`, error.message)
  }
  return []
}

async function migrateProducts() {
  console.log('\n📦 Migrando productos...')
  
  let products = []
  
  // Intentar desde Firebase
  if (firebaseInitialized) {
    try {
      const snapshot = await admin.firestore().collection('products').get()
      products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log(`   ✅ ${products.length} productos desde Firebase`)
    } catch (error) {
      console.warn(`   ⚠️  Error desde Firebase: ${error.message}`)
    }
  }
  
  // Si no hay productos, usar JSON
  if (products.length === 0) {
    products = loadJSON(productsPath)
    console.log(`   ✅ ${products.length} productos desde JSON`)
  }
  
  // Insertar en SQLite
  const insert = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, name, price, description, category, type, stock, imageUrl, size,
      minStock, cost, purchaseDate, lot, supplier, lastSaleDate, totalSold,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  const insertMany = db.transaction((items) => {
    for (const product of items) {
      insert.run(
        product.id,
        product.name,
        product.price,
        product.description || null,
        product.category,
        product.type,
        product.stock || 0,
        product.imageUrl || null,
        product.size || null,
        product.minStock || null,
        product.cost || null,
        product.purchaseDate || null,
        product.lot || null,
        product.supplier || null,
        product.lastSaleDate || null,
        product.totalSold || 0,
        new Date().toISOString(),
        new Date().toISOString()
      )
    }
  })
  
  insertMany(products)
  console.log(`   ✅ ${products.length} productos migrados a SQLite\n`)
}

async function migrateInventory() {
  console.log('📦 Migrando inventario...')
  
  let inventory = []
  
  // Intentar desde Firebase
  if (firebaseInitialized) {
    try {
      const snapshot = await admin.firestore().collection('inventory').get()
      inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log(`   ✅ ${inventory.length} items desde Firebase`)
    } catch (error) {
      console.warn(`   ⚠️  Error desde Firebase: ${error.message}`)
    }
  }
  
  // Si no hay inventario, usar JSON
  if (inventory.length === 0) {
    inventory = loadJSON(inventoryPath)
    console.log(`   ✅ ${inventory.length} items desde JSON`)
  }
  
  // Insertar en SQLite
  const insert = db.prepare(`
    INSERT OR REPLACE INTO inventory (
      id, name, category, quantity, unit, unitPrice, totalValue,
      code, purchaseDate, lot, supplier, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(
        item.id,
        item.name,
        item.category,
        item.quantity,
        item.unit,
        item.unitPrice,
        item.totalValue,
        item.code || null,
        item.purchaseDate || null,
        item.lot || null,
        item.supplier || null,
        item.notes || null,
        new Date().toISOString(),
        new Date().toISOString()
      )
    }
  })
  
  insertMany(inventory)
  console.log(`   ✅ ${inventory.length} items migrados a SQLite\n`)
}

async function migrateRecipes() {
  console.log('📝 Migrando recetas...')
  
  let recipes = []
  
  // Intentar desde Firebase
  if (firebaseInitialized) {
    try {
      const snapshot = await admin.firestore().collection('recipes').get()
      recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log(`   ✅ ${recipes.length} recetas desde Firebase`)
    } catch (error) {
      console.warn(`   ⚠️  Error desde Firebase: ${error.message}`)
    }
  }
  
  // Insertar en SQLite
  const insert = db.prepare(`
    INSERT OR REPLACE INTO recipes (
      id, productId, productName, category, ingredients, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  
  const insertMany = db.transaction((items) => {
    for (const recipe of items) {
      insert.run(
        recipe.id,
        recipe.productId,
        recipe.productName,
        recipe.category,
        JSON.stringify(recipe.ingredients || []),
        recipe.createdAt || new Date().toISOString(),
        recipe.updatedAt || new Date().toISOString()
      )
    }
  })
  
  insertMany(recipes)
  console.log(`   ✅ ${recipes.length} recetas migradas a SQLite\n`)
}

async function migrateSales() {
  console.log('💰 Migrando ventas...')
  
  let sales = []
  
  // Intentar desde Firebase
  if (firebaseInitialized) {
    try {
      const snapshot = await admin.firestore().collection('sales').get()
      sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      console.log(`   ✅ ${sales.length} ventas desde Firebase`)
    } catch (error) {
      console.warn(`   ⚠️  Error desde Firebase: ${error.message}`)
    }
  }
  
  // Si no hay ventas, usar JSON
  if (sales.length === 0) {
    sales = loadJSON(salesPath)
    console.log(`   ✅ ${sales.length} ventas desde JSON`)
  }
  
  // Insertar en SQLite
  const insert = db.prepare(`
    INSERT OR REPLACE INTO sales (
      id, date, hour, items, total, paymentMethod, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  const insertMany = db.transaction((items) => {
    for (const sale of items) {
      insert.run(
        sale.id,
        sale.date,
        sale.hour,
        JSON.stringify(sale.items || []),
        sale.total,
        sale.paymentMethod || null,
        sale.notes || null,
        new Date().toISOString(),
        new Date().toISOString()
      )
    }
  })
  
  insertMany(sales)
  console.log(`   ✅ ${sales.length} ventas migradas a SQLite\n`)
}

async function main() {
  console.log('\n' + '═'.repeat(80))
  console.log('🔄 MIGRACIÓN A SQLITE')
  console.log('═'.repeat(80))
  
  try {
    await migrateProducts()
    await migrateInventory()
    await migrateRecipes()
    await migrateSales()
    
    console.log('═'.repeat(80))
    console.log('✅ Migración completada exitosamente')
    console.log(`📁 Base de datos: ${dbPath}`)
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error en migración:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

main()
