/**
 * Genera informes/INFORME.md con ventas, ingresos, deudas y gastos desde la BD.
 * Uso: npx tsx scripts/export-informe.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { getSales } from '../lib/db-sales'
import { getExpenses } from '../lib/db-expenses'
import { generateInformeMarkdown } from '../informes/markdown'

async function main() {
  const [sales, expenses] = await Promise.all([getSales(), getExpenses()])
  const md = generateInformeMarkdown(sales as any, expenses as any)
  const out = path.join(process.cwd(), 'informes', 'INFORME.md')
  fs.writeFileSync(out, md, 'utf8')
  console.log('OK:', out)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
