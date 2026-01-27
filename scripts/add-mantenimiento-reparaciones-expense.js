#!/usr/bin/env node

/**
 * Script para agregar gasto de mantenimiento y reparaciones
 * 
 * Materiales:
 * - Cable dúplex: $7.000
 * - Cinta LED: $39.500
 * - Adaptador cinta LED: $8.000
 * - Canaleta e interruptor: $10.000
 * - Seguro de baño: $7.000
 * 
 * Mano de obra: $160.000
 * 
 * Total: $231.500
 * 
 * Pagado de la caja de Arándano: $71.500 (materiales)
 * Pagado por Gustavo: $160.000 (mano de obra)
 * 
 * Uso: node scripts/add-mantenimiento-reparaciones-expense.js
 */

require('dotenv').config({ path: '.env.local' })

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Configurar ruta de la base de datos
const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')

if (!fs.existsSync(dbPath)) {
  console.error('❌ Error: Base de datos no encontrada en:', dbPath)
  console.error('   Asegúrate de que la base de datos SQLite existe')
  process.exit(1)
}

// Conectar a la base de datos
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// Obtener fecha de hoy en formato YYYY-MM-DD
const today = new Date()
const expenseDate = today.toISOString().split('T')[0]

// Calcular montos
const materiales = {
  'Cable dúplex': 7000,
  'Cinta LED': 39500,
  'Adaptador cinta LED': 8000,
  'Canaleta e interruptor': 10000,
  'Seguro de baño': 7000
}

const totalMateriales = Object.values(materiales).reduce((sum, val) => sum + val, 0)
const manoObra = 160000
const totalGasto = totalMateriales + manoObra

// Datos del gasto
const expense = {
  date: expenseDate,
  type: 'variable', // Gasto variable (mantenimiento/reparaciones)
  category: 'other', // Categoría "other" para mantenimiento y reparaciones
  description: 'Mantenimiento y reparaciones - Instalación eléctrica y mejoras',
  amount: totalGasto,
  notes: `Materiales (pagados de la caja de Arándano - $${totalMateriales.toLocaleString('es-CO')}): ${Object.entries(materiales).map(([item, precio]) => `${item} $${precio.toLocaleString('es-CO')}`).join(', ')}. Mano de obra (pagada por Gustavo - $${manoObra.toLocaleString('es-CO')}): $${manoObra.toLocaleString('es-CO')}. Total: $${totalGasto.toLocaleString('es-CO')}`
}

try {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  AGREGANDO GASTO DE MANTENIMIENTO Y REPARACIONES')
  console.log('═══════════════════════════════════════════════════════════\n')
  
  console.log('📋 Información del gasto:')
  console.log(`   Fecha: ${expenseDate}`)
  console.log(`   Tipo: Variable`)
  console.log(`   Categoría: Otros (mantenimiento/reparaciones)`)
  console.log(`   Descripción: ${expense.description}`)
  console.log('')
  
  console.log('📦 Materiales (pagados de la caja de Arándano):')
  Object.entries(materiales).forEach(([item, precio]) => {
    console.log(`   - ${item}: $${precio.toLocaleString('es-CO')}`)
  })
  console.log(`   Subtotal materiales: $${totalMateriales.toLocaleString('es-CO')}`)
  console.log('')
  
  console.log('👷 Mano de obra (pagada por Gustavo):')
  console.log(`   - Mano de obra: $${manoObra.toLocaleString('es-CO')}`)
  console.log('')
  
  console.log(`💰 Total del gasto: $${totalGasto.toLocaleString('es-CO')}`)
  console.log('')
  
  console.log('📥 Agregando gasto a la base de datos...\n')
  
  // Generar ID único
  const id = `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  // Insertar en la base de datos
  const stmt = db.prepare(`
    INSERT INTO expenses (id, description, amount, date, category, type, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(
    id,
    expense.description,
    expense.amount,
    expense.date,
    expense.category,
    expense.type,
    expense.notes,
    now
  )
  
  console.log('   ✅ Gasto agregado correctamente')
  console.log(`   ID: ${id}`)
  console.log('')
  
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ✅ PROCESO COMPLETADO')
  console.log('═══════════════════════════════════════════════════════════\n')
  console.log(`✅ Gasto agregado exitosamente`)
  console.log(`💰 Monto total: $${totalGasto.toLocaleString('es-CO')}`)
  console.log(`   - Materiales (caja Arándano): $${totalMateriales.toLocaleString('es-CO')}`)
  console.log(`   - Mano de obra (Gustavo): $${manoObra.toLocaleString('es-CO')}`)
  console.log(`📅 Fecha: ${expenseDate}`)
  console.log(`📋 Tipo: Variable`)
  console.log(`📂 Categoría: Otros (mantenimiento/reparaciones)`)
  console.log(`📝 Descripción: ${expense.description}`)
  console.log('')
  
} catch (error) {
  console.error('❌ Error agregando gasto:', error.message)
  console.error(error)
  process.exit(1)
} finally {
  db.close()
}
