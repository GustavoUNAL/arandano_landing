#!/usr/bin/env node

/**
 * Script para verificar si los productos del lote de Paty (3 de enero) ya están registrados
 * 
 * Uso: node scripts/check-paty-lot.js
 */

require('dotenv').config({ path: '.env.local' })

const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

// Inicializar Firebase Admin
function initializeFirebase() {
  if (admin.apps.length === 0) {
    let serviceAccount
    
    // Prioridad 1: Variable de entorno
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      } catch (error) {
        console.error('Error parseando FIREBASE_SERVICE_ACCOUNT:', error.message)
        process.exit(1)
      }
    }
    
    // Prioridad 2: Archivo
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
      console.error('   Configura FIREBASE_SERVICE_ACCOUNT o crea firebase-service-account.json')
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

// Función para formatear fecha
function formatDate(dateString) {
  if (!dateString) return 'Sin fecha'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Función para normalizar nombre (buscar variaciones)
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

// Función para buscar coincidencia parcial de nombre
function matchesName(searchName, itemName) {
  const normalizedSearch = normalizeName(searchName)
  const normalizedItem = normalizeName(itemName)
  
  // Buscar palabras clave
  const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 2)
  const itemWords = normalizedItem.split(/\s+/)
  
  // Si todas las palabras clave están en el nombre del item
  return searchWords.every(word => 
    itemWords.some(itemWord => itemWord.includes(word) || word.includes(itemWord))
  )
}

// Items esperados del lote de Paty
const expectedItems = [
  {
    name: 'Toalla higiénica Kotex tela antibacter',
    category: 'productos de limpieza / bioseguridad',
    quantity: 1,
    unitPrice: 3950,
    totalValue: 3950
  },
  {
    name: 'Cinta aislante Tesa colores 10 m',
    category: 'activos / insumos de mantenimiento',
    quantity: 1,
    unitPrice: 3800,
    totalValue: 3800
  },
  {
    name: 'Tapas para vaso 6 oz bebida caliente',
    category: 'desechables',
    quantity: 1,
    unitPrice: 4600,
    totalValue: 4600
  },
  {
    name: 'Soda Bretaña 1500 ml',
    category: 'acompañantes',
    quantity: 2,
    unitPrice: 3800,
    totalValue: 7600
  },
  {
    name: 'Salsa mayonesa Bary Doy Pack 200 g',
    category: 'acompañantes',
    quantity: 1,
    unitPrice: 4100,
    totalValue: 4100
  },
  {
    name: 'Salsa de tomate Bary Doy Pack 200 g',
    category: 'acompañantes',
    quantity: 1,
    unitPrice: 4100,
    totalValue: 4100
  },
  {
    name: 'Mezclador de bambú El Sol x 500 uds',
    category: 'desechables',
    quantity: 1,
    unitPrice: 4900,
    totalValue: 4900
  },
  {
    name: 'Mostaneza Rancho La Constancia 190 g',
    category: 'acompañantes',
    quantity: 1,
    unitPrice: 6900,
    totalValue: 6900
  },
  {
    name: 'Festival palillos doble punta x 180 uds',
    category: 'desechables',
    quantity: 1,
    unitPrice: 2100,
    totalValue: 2100
  },
  {
    name: 'Ron Viejo de Caldas Tradicional 750 ml',
    category: 'licores',
    quantity: 1,
    unitPrice: 51900,
    totalValue: 51900
  },
  {
    name: 'Caja de carioca grande x 1',
    category: 'activos / insumos de mantenimiento',
    quantity: 1,
    unitPrice: 115000,
    totalValue: 115000
  }
]

const PURCHASE_DATE = '2026-01-03'
const SUPPLIER = 'Patty' // También buscar "Paty"

// Función principal
async function checkPatyLot() {
  console.log('\n🔍 VERIFICANDO LOTE DE PATY (3 DE ENERO DE 2026)\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    console.log(`\n📅 Fecha de compra: ${formatDate(PURCHASE_DATE)} (${PURCHASE_DATE})`)
    console.log(`🏪 Proveedor: Paty/Patty\n`)
    
    console.log('📥 Buscando items en Firebase...\n')
    
    // Obtener todos los items del inventario con la fecha y proveedor
    const inventorySnapshot = await db.collection('inventory')
      .where('purchaseDate', '==', PURCHASE_DATE)
      .get()
    
    const inventoryItems = []
    inventorySnapshot.forEach(doc => {
      const data = doc.data()
      const supplier = (data.supplier || '').toLowerCase()
      if (supplier.includes('paty') || supplier.includes('patty')) {
        inventoryItems.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    // También buscar sin filtro de fecha para encontrar items similares
    const allInventorySnapshot = await db.collection('inventory').get()
    const similarItems = []
    
    allInventorySnapshot.forEach(doc => {
      const data = doc.data()
      const supplier = (data.supplier || '').toLowerCase()
      if (supplier.includes('paty') || supplier.includes('patty')) {
        similarItems.push({
          id: doc.id,
          ...data
        })
      }
    })
    
    console.log(`✅ Se encontraron ${inventoryItems.length} items del lote de Paty del 3 de enero\n`)
    
    if (inventoryItems.length === 0) {
      console.log('⚠️  No se encontraron items con la fecha y proveedor especificados')
      console.log(`\n📋 Buscando items similares del proveedor Paty...\n`)
      
      if (similarItems.length > 0) {
        console.log(`Se encontraron ${similarItems.length} items del proveedor Paty en otras fechas:\n`)
        const dates = [...new Set(similarItems.map(i => i.purchaseDate))].sort()
        dates.forEach(date => {
          const items = similarItems.filter(i => i.purchaseDate === date)
          console.log(`   ${formatDate(date)} (${date}): ${items.length} items`)
        })
      }
    }
    
    // Verificar cada item esperado
    console.log('\n' + '═'.repeat(80))
    console.log('📋 VERIFICACIÓN ITEM POR ITEM')
    console.log('═'.repeat(80))
    
    const foundItems = []
    const missingItems = []
    
    for (const expected of expectedItems) {
      // Buscar en items del lote del 3 de enero
      let found = inventoryItems.find(item => 
        matchesName(expected.name, item.name) &&
        Math.abs((item.unitPrice || 0) - expected.unitPrice) < 100 // Permitir pequeña variación de precio
      )
      
      if (!found) {
        // Buscar en todos los items del proveedor
        found = similarItems.find(item => 
          matchesName(expected.name, item.name)
        )
      }
      
      if (found) {
        foundItems.push({
          expected,
          found,
          match: true
        })
        
        console.log(`\n✅ ${expected.name}`)
        console.log(`   Categoría esperada: ${expected.category}`)
        console.log(`   Categoría encontrada: ${found.category || 'N/A'}`)
        console.log(`   Cantidad esperada: ${expected.quantity}`)
        console.log(`   Cantidad encontrada: ${found.quantity || 'N/A'}`)
        console.log(`   Precio esperado: ${formatCurrency(expected.unitPrice)}`)
        console.log(`   Precio encontrado: ${formatCurrency(found.unitPrice || 0)}`)
        console.log(`   Fecha compra: ${found.purchaseDate ? formatDate(found.purchaseDate) : 'N/A'}`)
        console.log(`   Proveedor: ${found.supplier || 'N/A'}`)
        console.log(`   Lote: ${found.lot || 'Sin lote'}`)
        console.log(`   ID: ${found.id}`)
        
        // Verificar si coincide exactamente
        const exactMatch = found.purchaseDate === PURCHASE_DATE && 
                          (found.supplier || '').toLowerCase().includes('paty')
        if (exactMatch) {
          console.log(`   ✓ Coincide con el lote del 3 de enero`)
        } else {
          console.log(`   ⚠️  Encontrado en otra fecha/proveedor`)
        }
      } else {
        missingItems.push(expected)
        console.log(`\n❌ ${expected.name}`)
        console.log(`   Cantidad: ${expected.quantity}`)
        console.log(`   Precio: ${formatCurrency(expected.unitPrice)}`)
        console.log(`   Categoría: ${expected.category}`)
        console.log(`   NO ENCONTRADO en la base de datos`)
      }
    }
    
    // Resumen por categoría
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN POR CATEGORÍA')
    console.log('═'.repeat(80))
    
    const byCategory = {}
    expectedItems.forEach(item => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { expected: [], found: [] }
      }
      byCategory[item.category].expected.push(item)
      
      const found = foundItems.find(f => f.expected.name === item.name)
      if (found) {
        byCategory[item.category].found.push(found.found)
      }
    })
    
    Object.keys(byCategory).forEach(cat => {
      const catData = byCategory[cat]
      const expectedCount = catData.expected.length
      const foundCount = catData.found.length
      
      console.log(`\n${cat}:`)
      console.log(`   Esperados: ${expectedCount} items`)
      console.log(`   Encontrados: ${foundCount} items`)
      console.log(`   Faltantes: ${expectedCount - foundCount} items`)
    })
    
    // Resumen final
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN GENERAL')
    console.log('═'.repeat(80))
    console.log(`\n✅ Items encontrados: ${foundItems.length}/${expectedItems.length}`)
    console.log(`❌ Items faltantes: ${missingItems.length}/${expectedItems.length}`)
    
    const exactMatches = foundItems.filter(f => 
      f.found.purchaseDate === PURCHASE_DATE && 
      (f.found.supplier || '').toLowerCase().includes('paty')
    ).length
    
    console.log(`\n📅 Items del lote del 3 de enero: ${exactMatches}/${expectedItems.length}`)
    console.log(`📋 Items encontrados en otras fechas: ${foundItems.length - exactMatches}`)
    
    if (missingItems.length > 0) {
      console.log(`\n⚠️  Items que NO están registrados:`)
      missingItems.forEach(item => {
        console.log(`   - ${item.name} (${item.category})`)
      })
      console.log(`\n💡 Estos items necesitan ser agregados a la base de datos`)
    } else if (exactMatches === expectedItems.length) {
      console.log(`\n✅ Todos los items del lote ya están registrados en la base de datos`)
    } else {
      console.log(`\n⚠️  Algunos items se encontraron pero en otras fechas o con información diferente`)
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('✅ Verificación completada')
    console.log('═'.repeat(80) + '\n')
    
  } catch (error) {
    console.error('\n❌ Error verificando lote:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

// Ejecutar
checkPatyLot()
