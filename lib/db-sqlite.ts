/**
 * Configuración de SQLite para base de datos local
 * Fácil de migrar a PostgreSQL/MySQL en servidor cloud
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.join(process.cwd(), 'data', 'arandano.db')
const dbDir = path.dirname(dbPath)

// Asegurar que el directorio existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Crear conexión a la base de datos
let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL') // Mejor rendimiento
    db.pragma('foreign_keys = ON') // Habilitar foreign keys
    initializeDatabase()
  }
  return db
}

/**
 * Inicializa las tablas si no existen
 */
function initializeDatabase() {
  if (!db) return

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
      initialQuantity REAL,
      unit TEXT NOT NULL,
      capacity REAL,
      capacityUnit TEXT,
      currentCapacity REAL,
      currentCapacityUnit TEXT,
      unitsPerPackage REAL,
      unitsPerPackageUnit TEXT,
      productType TEXT,
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
  
  // Agregar columnas si no existen (para bases de datos existentes)
  try {
    db.exec(`ALTER TABLE inventory ADD COLUMN initialQuantity REAL`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding initialQuantity column:', e.message)
    }
  }
  
  try {
    db.exec(`ALTER TABLE inventory ADD COLUMN capacity REAL`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding capacity column:', e.message)
    }
  }
  
  try {
    db.exec(`ALTER TABLE inventory ADD COLUMN capacityUnit TEXT`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding capacityUnit column:', e.message)
    }
  }

  try {
    db.exec(`ALTER TABLE inventory ADD COLUMN currentCapacity REAL`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding currentCapacity column:', e.message)
    }
  }

  try {
    db.exec(`ALTER TABLE inventory ADD COLUMN currentCapacityUnit TEXT`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding currentCapacityUnit column:', e.message)
    }
  }

  try {
    db.exec(`ALTER TABLE inventory ADD COLUMN unitsPerPackage REAL`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding unitsPerPackage column:', e.message)
    }
  }

  try {
    db.exec(`ALTER TABLE inventory ADD COLUMN unitsPerPackageUnit TEXT`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding unitsPerPackageUnit column:', e.message)
    }
  }

  try {
    db.exec(`ALTER TABLE inventory ADD COLUMN productType TEXT`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding productType column:', e.message)
    }
  }

  try {
    db.exec(`ALTER TABLE inventory ADD COLUMN productId TEXT`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding productId column:', e.message)
    }
  }

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
  try {
    db.exec(`ALTER TABLE sales ADD COLUMN mesa TEXT`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding mesa column:', e.message)
    }
  }

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

  // Tabla de movimientos de stock
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      inventoryItemId TEXT,
      productId TEXT,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      reason TEXT,
      notes TEXT,
      date TEXT NOT NULL,
      createdAt TEXT
    )
  `)

  // Tabla de tareas
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      createdAt TEXT,
      completedAt TEXT,
      dueDate TEXT
    )
  `)
  // Migraciones para tareas (bases de datos existentes)
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN completedAt TEXT`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding completedAt column:', e.message)
    }
  }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN dueDate TEXT`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding dueDate column:', e.message)
    }
  }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN assignedTo TEXT`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding assignedTo column:', e.message)
    }
  }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN tags TEXT`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate column')) {
      console.warn('Error adding tags column:', e.message)
    }
  }

  // Tabla de gastos
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT
    )
  `)

  // Índices para mejorar rendimiento
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
    CREATE INDEX IF NOT EXISTS idx_recipes_productId ON recipes(productId);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_inventoryItemId ON stock_movements(inventoryItemId);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_productId ON stock_movements(productId);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
  `)
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

export default getDatabase
