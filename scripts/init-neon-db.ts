/**
 * Crea las tablas en PostgreSQL (Neon).
 * Uso: npx tsx scripts/init-neon-db.ts
 */

import { neon } from '@neondatabase/serverless'
import { ensurePostgresSchema } from '../lib/db-schema-postgres'
import { seedProductsIfEmpty } from '../lib/db-seed'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL no está configurado en .env')
    process.exit(1)
  }

  const sql = neon(url)
  await ensurePostgresSchema(sql)
  await seedProductsIfEmpty()
  console.log('✅ Esquema PostgreSQL creado en Neon')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
