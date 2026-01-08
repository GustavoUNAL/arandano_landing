#!/usr/bin/env node

/**
 * Script para verificar y agregar lote de Jumbo (27 de diciembre de 2025)
 * 
 * Uso: node scripts/check-jumbo-lot.js
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

// Función para normalizar nombre
function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .trim()
}

// Función para buscar coincidencia de nombre
function matchesName(searchName, itemName) {
  const normalizedSearch = normalizeName(searchName)
  const normalizedItem = normalizeName(itemName)
  
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 2)
  const itemWords = normalizedItem.split(/\s+/)
  
  return searchWords.every(word => 
    itemWords.some(itemWord => itemWord.includes(word) || word.includes(itemWord))
  )
}

// Items del lote de Jumbo
const jumboItems = [
  {
    name: 'Cerveza Heineken lata',
    category: 'cervezas',
    quantity: 1,
    unit: 'Lata',
    unitPrice: 6450,
    totalValue: 6450
  },
  {
    name: 'Gaseosa Coca-Cola 2.5L',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Botella',
    unitPrice: 15200,
    totalValue: 15200
  },
  {
    name: 'Baguette Cuisine & Co',
    category: 'acompañantes',
    quantity: 2,
    unit: 'Unidad',
    unitPrice: 12900,
    totalValue: 25800
  },
  {
    name: 'Lechuga batavia (0.458 kg)',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Kilogramo',
    unitPrice: 4580,
    totalValue: 4580
  },
  {
    name: 'Tomate chonto (0.515 kg)',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Kilogramo',
    unitPrice: 5180,
    totalValue: 5180
  },
  {
    name: 'Bolsa plástica',
    category: 'desechables',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 60,
    totalValue: 60
  },
  {
    name: 'Mezcla de ají',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 3530,
    totalValue: 3530
  },
  {
    name: 'Queso Colanta',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 15900,
    totalValue: 15900
  },
  {
    name: 'Pan Resplandor',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 11500,
    totalValue: 11500
  },
  {
    name: 'Arándanos',
    category: 'acompañantes',
    quantity: 1,
    unit: 'Unidad',
    unitPrice: 11700,
    totalValue: 11700
  },
  {
    name: 'Cerveza Budweiser lata',
    category: 'cervezas',
    quantity: 1,
    unit: 'Lata',
    unitPrice: 5000,
    totalValue: 5000
  }
]

const PURCHASE_DATE = '2025-12-27'
const SUPPLIER = 'Jumbo'
const lotNumber = `JUMBO-${PURCHASE_DATE.replace(/-/g, '')}-001`

// Función principal
async function checkAndAddJumboLot() {
  console.log('\n🔍 VERIFICANDO Y AGREGANDO LOTE DE JUMBO (27 DE DICIEMBRE DE 2025)\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📅 Fecha de compra: 27 de diciembre de 2025 (${PURCHASE_DATE})`)
    console.log(`🏪 Proveedor: ${SUPPLIER}`)
    console.log(`🏷️  Número de lote: ${lotNumber}\n`)
    
    // Obtener todos los items del inventario
    const allInventorySnapshot = await db.collection('inventory').get()
    const inventoryItems = []
    
    allInventorySnapshot.forEach(doc => {
      const data = doc.data()
      inventoryItems.push({
        id: doc.id,
        ...data
      })
    })
    
    console.log('📥 Verificando items en la base de datos...\n')
    
    // Verificar cada item
    const foundItems = []
    const missingItems = []
    
    for (const expected of jumboItems) {
      // Buscar por nombre y fecha/proveedor
      let found = inventoryItems.find(item => 
        matchesName(expected.name, item.name) &&
        item.purchaseDate === PURCHASE_DATE &&
        (item.supplier || '').toLowerCase().includes('jumbo')
      )
      
      // Si no se encuentra con fecha exacta, buscar por nombre
      if (!found) {
        found = inventoryItems.find(item => 
          matchesName(expected.name, item.name)
        )
      }
      
      if (found) {
        foundItems.push({
          expected,
          found,
          exactMatch: found.purchaseDate === PURCHASE_DATE && 
                     (found.supplier || '').toLowerCase().includes('jumbo')
        })
      } else {
        missingItems.push(expected)
      }
    }
    
    // Mostrar resultados
    console.log('═'.repeat(80))
    console.log('📋 VERIFICACIÓN ITEM POR ITEM')
    console.log('═'.repeat(80))
    
    foundItems.forEach(({ expected, found, exactMatch }) => {
      if (exactMatch) {
        console.log(`\n✅ ${expected.name}`)
        console.log(`   ✓ Ya está registrado en el lote del ${PURCHASE_DATE}`)
        console.log(`   Precio: ${formatCurrency(found.unitPrice || 0)}`)
        console.log(`   Lote: ${found.lot || 'Sin lote'}`)
      } else {
        console.log(`\n⚠️  ${expected.name}`)
        console.log(`   Encontrado en otra fecha/proveedor`)
        console.log(`   Fecha encontrada: ${found.purchaseDate || 'N/A'}`)
        console.log(`   Proveedor: ${found.supplier || 'N/A'}`)
        console.log(`   Precio: ${formatCurrency(found.unitPrice || 0)}`)
      }
    })
    
    missingItems.forEach(item => {
      console.log(`\n❌ ${item.name}`)
      console.log(`   NO ENCONTRADO - Se agregará al lote`)
      console.log(`   Cantidad: ${item.quantity} ${item.unit}`)
      console.log(`   Precio: ${formatCurrency(item.unitPrice)}`)
      console.log(`   Total: ${formatCurrency(item.totalValue)}`)
    })
    
    // Agregar items faltantes
    if (missingItems.length > 0) {
      console.log('\n' + '═'.repeat(80))
      console.log('📦 AGREGANDO ITEMS FALTANTES')
      console.log('═'.repeat(80))
      
      let totalValue = 0
      let successCount = 0
      let errorCount = 0
      
      for (const item of missingItems) {
        totalValue += item.totalValue
        
        try {
          const itemData = {
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalValue: item.totalValue,
            supplier: SUPPLIER,
            purchaseDate: PURCHASE_DATE,
            lot: lotNumber,
            notes: `Comprado en ${SUPPLIER} el 27 de diciembre de 2025`
          }
          
          const itemId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          await db.collection('inventory').doc(itemId).set(itemData)
          
          console.log(`   ✅ ${item.name} agregado correctamente`)
          successCount++
        } catch (error) {
          console.error(`   ❌ Error agregando ${item.name}:`, error.message)
          errorCount++
        }
      }
      
      console.log('\n' + '═'.repeat(80))
      console.log('📊 RESUMEN FINAL')
      console.log('═'.repeat(80))
      console.log(`\n✅ Items ya registrados: ${foundItems.filter(f => f.exactMatch).length}`)
      console.log(`✅ Items agregados: ${successCount}`)
      if (errorCount > 0) {
        console.log(`❌ Items con error: ${errorCount}`)
      }
      console.log(`💰 Valor total de items nuevos: ${formatCurrency(totalValue)}`)
      
      // Calcular total del lote
      const foundTotal = foundItems
        .filter(f => f.exactMatch)
        .reduce((sum, f) => sum + (f.found.totalValue || 0), 0)
      
      const totalLotValue = foundTotal + totalValue
      console.log(`💰 Valor total del lote completo: ${formatCurrency(totalLotValue)}`)
      console.log(`🏷️  Número de lote: ${lotNumber}`)
      
    } else {
      console.log('\n' + '═'.repeat(80))
      console.log('✅ TODOS LOS ITEMS YA ESTÁN REGISTRADOS')
      console.log('═'.repeat(80))
      console.log(`\nTodos los items del lote de Jumbo del ${PURCHASE_DATE} ya están en la base de datos`)
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Proceso completado')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
checkAndAddJumboLot()
