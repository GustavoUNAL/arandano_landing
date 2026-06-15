/**
 * Configuración de SQLite para base de datos local
 * Productos: nombre, descripción y precio obligatorios; sin duplicados (name + size).
 */

import { ensureDataDir, getDatabasePath, getDataDir } from '@/lib/db-path'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const dbPath = getDatabasePath()
const productsJsonPath = path.join(getDataDir(), 'products.json')

ensureDataDir()

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
 * Carga productos desde data/products.json: deduplica por (name, size),
 * garantiza nombre, descripción (no vacía cuando hay nombre) y precio.
 */
function seedProductsFromJson(database: Database.Database) {
  if (!fs.existsSync(productsJsonPath)) return
  try {
    const raw = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8')) as any[]
    const key = (p: any) => `${(p.name || '').toString().trim().toLowerCase()}\n${(p.size ?? '').toString().trim().toLowerCase()}`
    const seen = new Set<string>()
    const normalized = raw
      .filter((p) => {
        const n = (p.name || '').toString().trim()
        if (!n) return false
        const k = key(p)
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      .map((p) => ({
        id: p.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        name: (p.name || '').toString().trim(),
        price: Number(p.price) || 0,
        description: (p.description != null && p.description !== '') ? String(p.description).trim() : `Producto: ${(p.name || '').toString().trim()}`,
        category: (p.category || 'otros').toString().trim(),
        type: (p.type || 'bebida').toString().trim(),
        stock: Number(p.stock) ?? 0,
        imageUrl: p.imageUrl || null,
        size: (p.size != null ? String(p.size) : '').trim(),
        minStock: p.minStock != null ? Number(p.minStock) : null,
        cost: p.cost != null ? Number(p.cost) : null,
        purchaseDate: p.purchaseDate || null,
        lot: p.lot || null,
        supplier: p.supplier || null,
        lastSaleDate: p.lastSaleDate || null,
        totalSold: Number(p.totalSold) || 0
      }))
    const now = new Date().toISOString()
    const insert = database.prepare(`
      INSERT INTO products (id, name, price, description, category, type, stock, imageUrl, size, minStock, cost, purchaseDate, lot, supplier, lastSaleDate, totalSold, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const run = database.transaction((items: any[]) => {
      for (const p of items) {
        insert.run(p.id, p.name, p.price, p.description, p.category, p.type, p.stock, p.imageUrl || null, p.size || '', p.minStock, p.cost, p.purchaseDate, p.lot, p.supplier, p.lastSaleDate, p.totalSold, now, now)
      }
    })
    run(normalized)
  } catch (e) {
    console.warn('Seed productos desde JSON:', e)
  }
}

/**
 * Inicializa las tablas si no existen
 */
function initializeDatabase() {
  if (!db) return

  // Tabla de productos (nombre, descripción y precio son los datos de carta)
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      imageUrl TEXT,
      size TEXT DEFAULT '',
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

  // Migraciones productos: normalizar y evitar duplicados
  try {
    db.exec(`UPDATE products SET description = COALESCE(description, '') WHERE description IS NULL`)
    db.exec(`UPDATE products SET size = COALESCE(size, '') WHERE size IS NULL`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate')) console.warn('Migración productos (normalizar):', e.message)
  }
  try {
    // Eliminar duplicados: conservar uno por (name, size)
    db.exec(`
      DELETE FROM products WHERE id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY name, COALESCE(size,'') ORDER BY id) AS rn
          FROM products
        ) WHERE rn = 1
      )
    `)
  } catch (e: any) {
    if (!e.message?.includes('ROW_NUMBER') && !e.message?.includes('PARTITION')) console.warn('Migración productos (dedup):', e.message)
  }
  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_products_name_size ON products(name, size)`)
  } catch (e: any) {
    if (!e.message?.includes('duplicate') && !e.message?.includes('UNIQUE')) console.warn('Índice único productos:', e.message)
  }

  // Seed: si no hay productos, cargar desde data/products.json (deduplicado y con nombre/descripción/precio)
  const count = (db.prepare('SELECT COUNT(*) AS c FROM products').get() as { c: number }).c
  if (count === 0) {
    seedProductsFromJson(db)
  }

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

  db.exec(`
    CREATE TABLE IF NOT EXISTS site_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      visitedAt TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS site_clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      label TEXT NOT NULL,
      target TEXT NOT NULL,
      clickedAt TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS site_engagement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      durationSeconds INTEGER NOT NULL,
      recordedAt TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS sports_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      image TEXT,
      credits INTEGER NOT NULL DEFAULT 7200,
      displayAlias TEXT,
      totalPoints INTEGER NOT NULL DEFAULT 0,
      hasPassport INTEGER NOT NULL DEFAULT 0,
      hasKnockoutPassport INTEGER NOT NULL DEFAULT 0,
      lastCreditsRechargeDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS match_predictions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      matchId INTEGER NOT NULL,
      homeTeamName TEXT NOT NULL,
      awayTeamName TEXT NOT NULL,
      homeTeamCrest TEXT,
      awayTeamCrest TEXT,
      matchDate TEXT NOT NULL,
      matchGroup TEXT,
      homeScore INTEGER NOT NULL,
      awayScore INTEGER NOT NULL,
      creditsWagered INTEGER NOT NULL DEFAULT 100,
      actualHomeScore INTEGER,
      actualAwayScore INTEGER,
      pointsEarned INTEGER,
      settledAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE(userId, matchId),
      FOREIGN KEY (userId) REFERENCES sports_users(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS sports_teams (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      shortName TEXT,
      tla TEXT,
      crest TEXT,
      areaName TEXT,
      areaFlag TEXT,
      coach TEXT,
      founded INTEGER,
      clubColors TEXT,
      squadSize INTEGER,
      website TEXT,
      syncedAt TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS sports_competition (
      id TEXT PRIMARY KEY DEFAULT 'WC',
      name TEXT NOT NULL,
      emblem TEXT,
      startDate TEXT,
      endDate TEXT,
      currentMatchday INTEGER,
      syncedAt TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS sports_matches (
      id INTEGER PRIMARY KEY,
      utcDate TEXT NOT NULL,
      status TEXT NOT NULL,
      matchday INTEGER,
      stage TEXT NOT NULL,
      matchGroup TEXT,
      venue TEXT,
      homeTeamId INTEGER NOT NULL,
      awayTeamId INTEGER NOT NULL,
      scoreJson TEXT NOT NULL DEFAULT '{}',
      syncedAt TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      userAgent TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES sports_users(id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS push_notification_sent (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      notificationId TEXT NOT NULL,
      sentAt TEXT NOT NULL,
      UNIQUE(userId, notificationId),
      FOREIGN KEY (userId) REFERENCES sports_users(id)
    )
  `)

  const sportsMigrations = [
    'ALTER TABLE sports_users ADD COLUMN displayAlias TEXT',
    'ALTER TABLE sports_users ADD COLUMN totalPoints INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE sports_users ADD COLUMN hasPassport INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE sports_users ADD COLUMN hasKnockoutPassport INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE sports_users ADD COLUMN lastCreditsRechargeDate TEXT',
    'ALTER TABLE match_predictions ADD COLUMN actualHomeScore INTEGER',
    'ALTER TABLE match_predictions ADD COLUMN actualAwayScore INTEGER',
    'ALTER TABLE match_predictions ADD COLUMN pointsEarned INTEGER',
    'ALTER TABLE match_predictions ADD COLUMN settledAt TEXT',
  ]
  for (const sql of sportsMigrations) {
    try {
      db.exec(sql)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : ''
      if (!message.includes('duplicate column')) {
        console.warn('Sports migration:', message)
      }
    }
  }

  // Índices para mejorar rendimiento
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_site_visits_visitedAt ON site_visits(visitedAt);
    CREATE INDEX IF NOT EXISTS idx_site_clicks_clickedAt ON site_clicks(clickedAt);
    CREATE INDEX IF NOT EXISTS idx_site_engagement_recordedAt ON site_engagement(recordedAt);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
    CREATE INDEX IF NOT EXISTS idx_recipes_productId ON recipes(productId);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_inventoryItemId ON stock_movements(inventoryItemId);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_productId ON stock_movements(productId);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_match_predictions_userId ON match_predictions(userId);
    CREATE INDEX IF NOT EXISTS idx_match_predictions_matchId ON match_predictions(matchId);
    CREATE INDEX IF NOT EXISTS idx_match_predictions_settledAt ON match_predictions(settledAt);
    CREATE INDEX IF NOT EXISTS idx_sports_users_totalPoints ON sports_users(totalPoints);
    CREATE INDEX IF NOT EXISTS idx_sports_users_displayAlias ON sports_users(displayAlias);
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_userId ON push_subscriptions(userId);
    CREATE INDEX IF NOT EXISTS idx_push_notification_sent_userId ON push_notification_sent(userId);
    CREATE INDEX IF NOT EXISTS idx_sports_matches_utcDate ON sports_matches(utcDate);
    CREATE INDEX IF NOT EXISTS idx_sports_matches_status ON sports_matches(status);
    CREATE INDEX IF NOT EXISTS idx_sports_matches_stage ON sports_matches(stage);
  `)
}

export { getDatabasePath, getDataDir, getProjectRoot } from '@/lib/db-path'

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
