/**
 * Verificación pre-despliegue — SQLite + Polla Mundialista + NextAuth
 */

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const envPath = path.join(root, '.env.local')

console.log('═══════════════════════════════════════════════════════════')
console.log('  VERIFICACIÓN PRE-DESPLIEGUE — Arándano Café Bar')
console.log('═══════════════════════════════════════════════════════════\n')

const errors = []
const warnings = []

function ok(msg) {
  console.log(`  ✅ ${msg}`)
}

function fail(msg) {
  console.log(`  ❌ ${msg}`)
  errors.push(msg)
}

function warn(msg) {
  console.log(`  ⚠️  ${msg}`)
  warnings.push(msg)
}

// 1. Build
console.log('1️⃣  Build de producción')
if (fs.existsSync(path.join(root, '.next', 'standalone', 'server.js'))) {
  ok('Servidor standalone (.next/standalone/server.js)')
} else {
  warn('Build standalone no encontrado — ejecuta: npm run build')
}

// 2. Variables de entorno
console.log('\n2️⃣  Variables de entorno (.env.local)')
const requiredVars = [
  { key: 'DB_MODE', hint: 'postgres (Neon) o sqlite' },
  { key: 'ADMIN_PASSWORD', hint: 'contraseña del panel admin' },
  { key: 'NEXTAUTH_URL', hint: 'https://arandanocafe.com (no usar localhost en producción)' },
  { key: 'NEXTAUTH_SECRET', hint: 'openssl rand -base64 32' },
  { key: 'GOOGLE_CLIENT_ID', hint: 'Google Cloud Console' },
  { key: 'GOOGLE_CLIENT_SECRET', hint: 'Google Cloud Console' },
  { key: 'FOOTBALL_DATA_API_TOKEN', hint: 'football-data.org' },
]

if (!fs.existsSync(envPath)) {
  fail('.env.local no encontrado — copia desde .env.example')
} else {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const { key, hint } of requiredVars) {
    const line = envContent.split('\n').find((l) => l.startsWith(`${key}=`))
    if (!line || line.trim() === `${key}=` || line.trim() === `${key}=""`) {
      fail(`${key} vacío o ausente (${hint})`)
    } else {
      ok(key)
    }
  }
  if (envContent.includes('DB_MODE=postgres')) {
    ok('DB_MODE=postgres (base en la nube)')
    const dbUrl = envContent.split('\n').find((l) => l.startsWith('DATABASE_URL='))
    if (!dbUrl || dbUrl.trim() === 'DATABASE_URL=') {
      fail('DATABASE_URL vacío — requerido con DB_MODE=postgres')
    } else {
      ok('DATABASE_URL configurado')
    }
  } else if (envContent.includes('DB_MODE=sqlite')) {
    ok('DB_MODE=sqlite (archivo local en el servidor)')
  } else if (envContent.includes('DB_MODE=json')) {
    warn('DB_MODE=json — en producción usar postgres o sqlite')
  }
  const nextAuthLine = envContent.split('\n').find((l) => l.startsWith('NEXTAUTH_URL='))
  if (nextAuthLine && /localhost|127\.0\.0\.1/i.test(nextAuthLine)) {
    warn(
      'NEXTAUTH_URL apunta a localhost — en el servidor usar https://arandanocafe.com y AUTH_TRUST_HOST=true'
    )
  }
  if (!envContent.includes('AUTH_TRUST_HOST=true')) {
    warn('AUTH_TRUST_HOST=true recomendado en producción (OAuth detrás de Nginx)')
  }
}

// 3. Base de datos
console.log('\n3️⃣  Base de datos')
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
const usesPostgres = envContent.includes('DB_MODE=postgres')

if (usesPostgres) {
  ok('Polla y café usan PostgreSQL (Neon) — mismo DATABASE_URL en local y servidor')
  console.log('\n   Ejecuta en local o VPS: npm run check:neon')
} else {
const dbPath = path.join(root, 'data', 'arandano.db')
if (fs.existsSync(dbPath)) {
  const sizeMb = (fs.statSync(dbPath).size / (1024 * 1024)).toFixed(2)
  ok(`data/arandano.db (${sizeMb} MB)`)
  try {
    const Database = require('better-sqlite3')
    const db = new Database(dbPath, { readonly: true })
    const tables = ['sports_users', 'match_predictions', 'products', 'sales']
    for (const table of tables) {
      const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table)
      if (row) ok(`Tabla ${table}`)
      else warn(`Tabla ${table} no existe (se creará al iniciar)`)
    }
    const users = db.prepare('SELECT COUNT(*) AS c FROM sports_users').get()
    const preds = db.prepare('SELECT COUNT(*) AS c FROM match_predictions').get()
    ok(`Polla: ${users.c} usuarios, ${preds.c} pronósticos`)
    db.close()
  } catch (e) {
    warn(`No se pudo inspeccionar SQLite: ${e.message}`)
  }
} else {
  warn('data/arandano.db no existe — se creará en el primer arranque')
}
}

// 4. Dependencias críticas
console.log('\n4️⃣  Dependencias')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
for (const dep of ['better-sqlite3', 'next-auth', 'next']) {
  if (pkg.dependencies?.[dep]) ok(dep)
  else fail(`Falta dependencia: ${dep}`)
}

// 5. Rutas API sports
console.log('\n5️⃣  API Polla Mundialista')
const apiRoutes = [
  'app/api/sports/me/route.ts',
  'app/api/sports/predictions/route.ts',
  'app/api/sports/leaderboard/route.ts',
  'app/api/auth/[...nextauth]/route.ts',
  'app/api/football/world-cup/route.ts',
]
for (const route of apiRoutes) {
  if (fs.existsSync(path.join(root, route))) ok(route)
  else fail(`Falta: ${route}`)
}

// 6. PM2
console.log('\n6️⃣  Configuración PM2')
const ecosystemPath = path.join(root, 'ecosystem.config.js')
if (fs.existsSync(ecosystemPath)) {
  ok('ecosystem.config.js')
  const eco = fs.readFileSync(ecosystemPath, 'utf8')
  if (eco.includes('DATABASE_PATH') && eco.includes('PROJECT_ROOT')) {
    ok('PROJECT_ROOT y DATABASE_PATH configurados')
  } else {
    warn('ecosystem.config.js sin DATABASE_PATH — revisar rutas SQLite')
  }
} else {
  fail('ecosystem.config.js no encontrado')
}

// 7. Archivos de datos JSON (semilla)
console.log('\n7️⃣  Datos JSON (semilla)')
const productsJson = path.join(root, 'data', 'products.json')
if (fs.existsSync(productsJson)) ok('data/products.json')
else warn('data/products.json no encontrado')

// Resumen
console.log('\n═══════════════════════════════════════════════════════════')
if (errors.length === 0) {
  console.log('  ✅ LISTO PARA DESPLEGAR')
  console.log('═══════════════════════════════════════════════════════════\n')
  if (warnings.length) {
    console.log('Advertencias:')
    warnings.forEach((w) => console.log(`  - ${w}`))
    console.log('')
  }
  console.log('Despliegue:')
  console.log('  npm run check:neon    # verificar Neon')
  console.log('  npm run deploy:ovh')
  console.log('  o: npm run build && pm2 start ecosystem.config.js')
  console.log('\nVer DEPLOY.md para OAuth Google, Neon SQL y backups.\n')
} else {
  console.log('  ❌ CORRIGE ESTOS ERRORES ANTES DE DESPLEGAR')
  console.log('═══════════════════════════════════════════════════════════\n')
  errors.forEach((e) => console.log(`  - ${e}`))
  if (warnings.length) {
    console.log('\nAdvertencias:')
    warnings.forEach((w) => console.log(`  - ${w}`))
  }
  process.exit(1)
}
