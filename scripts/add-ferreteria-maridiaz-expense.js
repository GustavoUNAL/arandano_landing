#!/usr/bin/env node

/**
 * Script para agregar gasto de reparaciones de Ferretería Maridíaz (23 de diciembre de 2025)
 * 
 * Uso: node scripts/add-ferreteria-maridiaz-expense.js
 */

require('dotenv').config({ path: '.env.local' })

const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

// Inicializar Firebase Admin
function initializeFirebase() {
  if (admin.apps.length === 0) {
    let serviceAccount
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      } catch (error) {
        console.error('Error parseando FIREBASE_SERVICE_ACCOUNT:', error.message)
        process.exit(1)
      }
    }
    
    if (!serviceAccount) {
      const possiblePaths = [
        path.join(process.cwd(), 'firebase-service-account.json'),
        path.join(process.cwd(), '..', 'firebase-service-account.json'),
        path.join(__dirname, '..', 'firebase-service-account.json'),
      ]
      
      for (const accountPath of possiblePaths) {
        if (fs.existsSync(accountPath)) {
          try {
            const fileContent = fs.readFileSync(accountPath, 'utf8')
            serviceAccount = JSON.parse(fileContent)
            console.log(`✅ Firebase Service Account encontrado en: ${accountPath}`)
            break
          } catch (error) {
            console.error(`Error leyendo ${accountPath}:`, error.message)
          }
        }
      }
    }
    
    if (!serviceAccount) {
      console.error('❌ Error: Firebase Service Account no encontrado')
      process.exit(1)
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    
    console.log(`✅ Firebase conectado a proyecto: ${serviceAccount.project_id || 'unknown'}`)
  }
  
  return admin.firestore()
}

// Función para formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Datos del gasto
const expenseDate = '2025-12-23'
const expense = {
  date: expenseDate,
  type: 'variable', // Gasto variable (reparaciones)
  category: 'other', // Categoría "other" para reparaciones/mantenimiento
  description: 'Adecuaciones / mantenimiento locativo - Ferretería Maridíaz',
  amount: 31300,
  notes: `Gasto de reparaciones y mantenimiento. Items: 6 metros dúplex ($9,600), 1 cinta aislante ($2,500), 1 chazo + tornillo ($2,500), 1 enchufe ($4,800), 2 tornillos ($400), 1 broca muro 5/16 ($5,900). Total: $31,300`
}

// Función principal
async function addFerreteriaMaridiazExpense() {
  console.log('\n💰 AGREGANDO GASTO DE REPARACIONES - FERRETERÍA MARIDÍAZ\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📅 Fecha del gasto: 23 de diciembre de 2025 (${expenseDate})`)
    console.log(`🏪 Proveedor: Ferretería Maridíaz`)
    console.log(`📋 Tipo: ${expense.type === 'fixed' ? 'Fijo' : 'Variable'}`)
    console.log(`📂 Categoría: ${expense.category}`)
    console.log(`💰 Monto: ${formatCurrency(expense.amount)}\n`)
    
    console.log('📝 Detalle del gasto:')
    console.log(`   Descripción: ${expense.description}`)
    console.log(`   Items incluidos:`)
    console.log(`     - 6 metros dúplex: $9,600`)
    console.log(`     - 1 cinta aislante: $2,500`)
    console.log(`     - 1 chazo + tornillo: $2,500`)
    console.log(`     - 1 enchufe: $4,800`)
    console.log(`     - 2 tornillos: $400`)
    console.log(`     - 1 broca muro 5/16: $5,900`)
    console.log(`   Total: ${formatCurrency(expense.amount)}\n`)
    
    console.log('📥 Agregando gasto a Firebase...\n')
    
    try {
      const expenseData = {
        date: expense.date,
        type: expense.type,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        notes: expense.notes
      }
      
      const expenseId = `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await db.collection('expenses').doc(expenseId).set({
        ...expenseData,
        id: expenseId
      })
      
      console.log(`   ✅ Gasto agregado correctamente`)
      console.log(`   ID: ${expenseId}`)
      
      console.log('\n' + '═'.repeat(80))
      console.log('📊 RESUMEN')
      console.log('═'.repeat(80))
      console.log(`\n✅ Gasto agregado exitosamente`)
      console.log(`💰 Monto: ${formatCurrency(expense.amount)}`)
      console.log(`📅 Fecha: ${expenseDate}`)
      console.log(`🏪 Proveedor: Ferretería Maridíaz`)
      console.log(`📋 Tipo: Variable`)
      console.log(`📂 Categoría: Otros (reparaciones/mantenimiento)`)
      console.log(`📝 Descripción: ${expense.description}`)
      
      console.log('\n' + '═'.repeat(80))
      console.log('✅ Proceso completado')
      console.log('═'.repeat(80) + '\n')
      
    } catch (error) {
      console.error(`   ❌ Error agregando gasto:`, error.message)
      throw error
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
addFerreteriaMaridiazExpense()
