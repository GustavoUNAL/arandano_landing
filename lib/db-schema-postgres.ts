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
    credits INTEGER NOT NULL DEFAULT 7200,
    displayalias TEXT,
    totalpoints INTEGER NOT NULL DEFAULT 0,
    haspassport INTEGER NOT NULL DEFAULT 0,
    hasknockoutpassport INTEGER NOT NULL DEFAULT 0,
    lastcreditsrechargedate TEXT,
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

  `CREATE TABLE IF NOT EXISTS sports_teams (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    shortname TEXT,
    tla TEXT,
    crest TEXT,
    areaname TEXT,
    areaflag TEXT,
    coach TEXT,
    founded INTEGER,
    clubcolors TEXT,
    squadsize INTEGER,
    website TEXT,
    syncedat TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS sports_competition (
    id TEXT PRIMARY KEY DEFAULT 'WC',
    name TEXT NOT NULL,
    emblem TEXT,
    startdate TEXT,
    enddate TEXT,
    currentmatchday INTEGER,
    syncedat TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS sports_matches (
    id INTEGER PRIMARY KEY,
    utcdate TEXT NOT NULL,
    status TEXT NOT NULL,
    matchday INTEGER,
    stage TEXT NOT NULL,
    matchgroup TEXT,
    venue TEXT,
    hometeamid INTEGER NOT NULL,
    awayteamid INTEGER NOT NULL,
    scorejson TEXT NOT NULL DEFAULT '{}',
    syncedat TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sports_matches_utcdate ON sports_matches(utcdate)`,
  `CREATE INDEX IF NOT EXISTS idx_sports_matches_status ON sports_matches(status)`,
  `CREATE INDEX IF NOT EXISTS idx_sports_matches_stage ON sports_matches(stage)`,

  `CREATE TABLE IF NOT EXISTS sports_api_usage (
    usagedate TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  )`,
]

let schemaReady = false

const POSTGRES_MIGRATIONS = [
  // api-football.com integration
  `ALTER TABLE sports_matches ADD COLUMN IF NOT EXISTS af_fixture_id INTEGER`,
  `CREATE INDEX IF NOT EXISTS idx_sports_matches_af ON sports_matches(af_fixture_id)`,
  `CREATE TABLE IF NOT EXISTS af_match_cache (
    af_fixture_id INTEGER PRIMARY KEY,
    stats       JSONB,
    events      JSONB,
    lineups     JSONB,
    players     JSONB,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS af_tournament_cache (
    cache_key   TEXT PRIMARY KEY,
    data        JSONB NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `ALTER TABLE sports_users ADD COLUMN IF NOT EXISTS haspassport INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE sports_users ADD COLUMN IF NOT EXISTS hasknockoutpassport INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE sports_users ADD COLUMN IF NOT EXISTS lastcreditsrechargedate TEXT`,
  `ALTER TABLE sports_users ADD COLUMN IF NOT EXISTS whatsapp TEXT`,
  `ALTER TABLE sports_users ADD COLUMN IF NOT EXISTS whatsapppromptskipped INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE knockout_passport_requests ADD COLUMN IF NOT EXISTS receiptpath TEXT`,

  `CREATE TABLE IF NOT EXISTS ari_threads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    context JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ari_threads_user_updated ON ari_threads(user_id, updated_at DESC)`,

  `CREATE TABLE IF NOT EXISTS ari_messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES ari_threads(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ari_messages_thread ON ari_messages(thread_id, created_at)`,

  `CREATE TABLE IF NOT EXISTS ari_usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    thread_id TEXT REFERENCES ari_threads(id),
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    tool_calls INTEGER NOT NULL DEFAULT 0,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ari_usage_user ON ari_usage_logs(user_id, created_at)`,

  `CREATE TABLE IF NOT EXISTS ari_welcome_snapshots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date_key TEXT NOT NULL,
    content TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date_key)
  )`,

  `CREATE TABLE IF NOT EXISTS ari_promotions (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    cta_label TEXT,
    cta_url TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    priority INTEGER NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true
  )`,

  `CREATE TABLE IF NOT EXISTS sports_api_usage (
    usagedate TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS knockout_passport_requests (
    id TEXT PRIMARY KEY,
    userid TEXT NOT NULL REFERENCES sports_users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    pricecop INTEGER NOT NULL,
    usernote TEXT,
    adminnote TEXT,
    reviewedby TEXT,
    createdat TEXT NOT NULL,
    updatedat TEXT NOT NULL,
    reviewedat TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_kpr_userid ON knockout_passport_requests(userid)`,
  `CREATE INDEX IF NOT EXISTS idx_kpr_status ON knockout_passport_requests(status)`,
]

export async function ensurePostgresSchema(sql: NeonQueryFunction<false, false>): Promise<void> {
  if (schemaReady) return
  for (const statement of SCHEMA_STATEMENTS) {
    await sql.query(statement)
  }
  for (const statement of POSTGRES_MIGRATIONS) {
    await sql.query(statement)
  }
  schemaReady = true
}
