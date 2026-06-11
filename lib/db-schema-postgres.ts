import type { NeonQueryFunction } from '@neondatabase/serverless'

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    imageurl TEXT,
    size TEXT DEFAULT '',
    minstock INTEGER,
    cost DOUBLE PRECISION,
    purchasedate TEXT,
    lot TEXT,
    supplier TEXT,
    lastsaledate TEXT,
    totalsold INTEGER DEFAULT 0,
    createdat TEXT,
    updatedat TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_products_name_size ON products(name, size)`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
  `CREATE INDEX IF NOT EXISTS idx_products_type ON products(type)`,

  `CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity DOUBLE PRECISION NOT NULL,
    initialquantity DOUBLE PRECISION,
    unit TEXT NOT NULL,
    capacity DOUBLE PRECISION,
    capacityunit TEXT,
    currentcapacity DOUBLE PRECISION,
    currentcapacityunit TEXT,
    unitsperpackage DOUBLE PRECISION,
    unitsperpackageunit TEXT,
    producttype TEXT,
    unitprice DOUBLE PRECISION NOT NULL,
    totalvalue DOUBLE PRECISION NOT NULL,
    code TEXT,
    purchasedate TEXT,
    lot TEXT,
    supplier TEXT,
    notes TEXT,
    productid TEXT,
    createdat TEXT,
    updatedat TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category)`,

  `CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    hour INTEGER NOT NULL,
    items TEXT NOT NULL,
    total DOUBLE PRECISION NOT NULL,
    paymentmethod TEXT,
    notes TEXT,
    mesa TEXT,
    createdat TEXT,
    updatedat TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)`,

  `CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    productid TEXT NOT NULL,
    productname TEXT NOT NULL,
    category TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    createdat TEXT,
    updatedat TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_recipes_productid ON recipes(productid)`,

  `CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    inventoryitemid TEXT,
    productid TEXT,
    type TEXT NOT NULL,
    quantity DOUBLE PRECISION NOT NULL,
    unit TEXT NOT NULL,
    reason TEXT,
    notes TEXT,
    date TEXT NOT NULL,
    createdat TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_stock_movements_inventoryitemid ON stock_movements(inventoryitemid)`,
  `CREATE INDEX IF NOT EXISTS idx_stock_movements_productid ON stock_movements(productid)`,

  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    createdat TEXT,
    completedat TEXT,
    duedate TEXT,
    assignedto TEXT,
    tags TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`,

  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    notes TEXT,
    createdat TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)`,

  `CREATE TABLE IF NOT EXISTS site_visits (
    id SERIAL PRIMARY KEY,
    path TEXT NOT NULL,
    visitedat TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_site_visits_visitedat ON site_visits(visitedat)`,

  `CREATE TABLE IF NOT EXISTS site_clicks (
    id SERIAL PRIMARY KEY,
    path TEXT NOT NULL,
    label TEXT NOT NULL,
    target TEXT NOT NULL,
    clickedat TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_site_clicks_clickedat ON site_clicks(clickedat)`,

  `CREATE TABLE IF NOT EXISTS site_engagement (
    id SERIAL PRIMARY KEY,
    path TEXT NOT NULL,
    durationseconds INTEGER NOT NULL,
    recordedat TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_site_engagement_recordedat ON site_engagement(recordedat)`,

  `CREATE TABLE IF NOT EXISTS sports_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    image TEXT,
    credits INTEGER NOT NULL DEFAULT 20000,
    displayalias TEXT,
    totalpoints INTEGER NOT NULL DEFAULT 0,
    createdat TEXT NOT NULL,
    updatedat TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sports_users_totalpoints ON sports_users(totalpoints)`,
  `CREATE INDEX IF NOT EXISTS idx_sports_users_displayalias ON sports_users(displayalias)`,

  `CREATE TABLE IF NOT EXISTS match_predictions (
    id TEXT PRIMARY KEY,
    userid TEXT NOT NULL REFERENCES sports_users(id),
    matchid INTEGER NOT NULL,
    hometeamname TEXT NOT NULL,
    awayteamname TEXT NOT NULL,
    hometeamcrest TEXT,
    awayteamcrest TEXT,
    matchdate TEXT NOT NULL,
    matchgroup TEXT,
    homescore INTEGER NOT NULL,
    awayscore INTEGER NOT NULL,
    creditswagered INTEGER NOT NULL DEFAULT 100,
    actualhomescore INTEGER,
    actualawayscore INTEGER,
    pointsearned INTEGER,
    settledat TEXT,
    createdat TEXT NOT NULL,
    updatedat TEXT NOT NULL,
    UNIQUE(userid, matchid)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_match_predictions_userid ON match_predictions(userid)`,
  `CREATE INDEX IF NOT EXISTS idx_match_predictions_matchid ON match_predictions(matchid)`,
  `CREATE INDEX IF NOT EXISTS idx_match_predictions_settledat ON match_predictions(settledat)`,
]

let schemaReady = false

export async function ensurePostgresSchema(sql: NeonQueryFunction<false, false>): Promise<void> {
  if (schemaReady) return
  for (const statement of SCHEMA_STATEMENTS) {
    await sql.query(statement)
  }
  schemaReady = true
}
