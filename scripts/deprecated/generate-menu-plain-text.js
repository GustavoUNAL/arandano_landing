#!/usr/bin/env node

/**
 * Script para generar el listado de productos por categoría en texto plano
 * Útil para usar en otros lugares (WhatsApp, impresión, etc.)
 */

require('dotenv').config({ path: '.env.local' })
const admin = require('firebase-admin')

// Inicializar Firebase Admin
let db
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json'
  let serviceAccount
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  } else {
    const fs = require('fs')
    const path = require('path')
    const accountPath = path.resolve(serviceAccountPath)
    if (!fs.existsSync(accountPath)) {
      throw new Error(`No se encontró el archivo de credenciales: ${accountPath}`)
    }
    serviceAccount = JSON.parse(fs.readFileSync(accountPath, 'utf8'))
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
  }

  db = admin.firestore()
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message)
  process.exit(1)
}

// Mapeo de categorías a nombres amigables
const categoryNames = {
  'cafe-caliente': '☕ Cafés Calientes',
  'cafe-frio': '🧊 Cafés Fríos',
  'pasteleria': '🍰 Pastelería',
  'combo': '🍽️ Combos',
  'coctel': '🍹 Cócteles',
  'cerveza': '🍺 Cervezas',
  'vino': '🍷 Vinos',
  'vodka': '🥃 Vodka',
  'ginebra': '🍸 Ginebra',
  'tequila': '🥃 Tequila',
  'whisky': '🥃 Whisky'
}

// Orden de categorías para el menú
const categoryOrder = [
  'cafe-caliente',
  'cafe-frio',
  'pasteleria',
  'combo',
  'coctel',
  'cerveza',
  'vino',
  'vodka',
  'ginebra',
  'tequila',
  'whisky'
]

// Función para formatear precio
function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Función para formatear nombre con tamaño si existe
function formatProductName(product) {
  let name = product.name
  if (product.size) {
    name += ` (${product.size})`
  }
  return name
}

async function generateMenu() {
  try {
    console.log('📋 Generando listado de productos por categoría...\n')
    
    // Obtener productos de Firebase
    const productsSnapshot = await db.collection('products').get()
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    if (products.length === 0) {
      console.log('⚠️  No se encontraron productos en la base de datos')
      return
    }
    
    // Agrupar productos por categoría
    const productsByCategory = {}
    
    products.forEach(product => {
      const category = product.category || 'other'
      if (!productsByCategory[category]) {
        productsByCategory[category] = []
      }
      productsByCategory[category].push(product)
    })
    
    // Ordenar productos dentro de cada categoría por nombre
    Object.keys(productsByCategory).forEach(category => {
      productsByCategory[category].sort((a, b) => 
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      )
    })
    
    // Generar el texto del menú
    let menuText = '='.repeat(60) + '\n'
    menuText += '📋 MENÚ ARÁNDANO CAFÉ BAR\n'
    menuText += '='.repeat(60) + '\n\n'
    
    // Recorrer categorías en el orden definido
    categoryOrder.forEach(category => {
      if (productsByCategory[category] && productsByCategory[category].length > 0) {
        const categoryName = categoryNames[category] || category
        menuText += `\n${categoryName}\n`
        menuText += '-'.repeat(60) + '\n'
        
        productsByCategory[category].forEach(product => {
          const productName = formatProductName(product)
          const price = formatPrice(product.price)
          const stock = product.stock !== undefined ? product.stock : 'N/A'
          
          menuText += `  • ${productName}`
          menuText += ` - ${price}`
          
          // Agregar descripción si existe
          if (product.description) {
            menuText += `\n    ${product.description}`
          }
          
          menuText += '\n'
        })
      }
    })
    
    // Verificar si hay categorías no mapeadas
    Object.keys(productsByCategory).forEach(category => {
      if (!categoryOrder.includes(category)) {
        menuText += `\n${category.toUpperCase()}\n`
        menuText += '-'.repeat(60) + '\n'
        
        productsByCategory[category].forEach(product => {
          const productName = formatProductName(product)
          const price = formatPrice(product.price)
          menuText += `  • ${productName} - ${price}\n`
        })
      }
    })
    
    menuText += '\n' + '='.repeat(60) + '\n'
    menuText += `Total de productos: ${products.length}\n`
    menuText += '='.repeat(60) + '\n'
    
    // Mostrar el menú
    console.log(menuText)
    
    // Guardar en archivo
    const fs = require('fs')
    const path = require('path')
    const outputPath = path.join(process.cwd(), 'MENU.txt')
    fs.writeFileSync(outputPath, menuText, 'utf8')
    console.log(`\n✅ Menú guardado en: ${outputPath}\n`)
    
    // También generar una versión para WhatsApp (más compacta)
    let whatsappMenu = '*📋 MENÚ ARÁNDANO CAFÉ BAR*\n\n'
    
    categoryOrder.forEach(category => {
      if (productsByCategory[category] && productsByCategory[category].length > 0) {
        const categoryName = categoryNames[category] || category
        whatsappMenu += `*${categoryName}*\n`
        
        productsByCategory[category].forEach(product => {
          const productName = formatProductName(product)
          const price = formatPrice(product.price)
          whatsappMenu += `• ${productName} - ${price}\n`
        })
        
        whatsappMenu += '\n'
      }
    })
    
    whatsappMenu += `_Total: ${products.length} productos_\n`
    
    const whatsappPath = path.join(process.cwd(), 'MENU_WHATSAPP.txt')
    fs.writeFileSync(whatsappPath, whatsappMenu, 'utf8')
    console.log(`✅ Menú para WhatsApp guardado en: ${whatsappPath}\n`)
    
    // Mostrar estadísticas por categoría
    console.log('📊 Estadísticas por categoría:\n')
    categoryOrder.forEach(category => {
      if (productsByCategory[category] && productsByCategory[category].length > 0) {
        const categoryName = categoryNames[category] || category
        const count = productsByCategory[category].length
        console.log(`  ${categoryName}: ${count} producto(s)`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error generando menú:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Ejecutar
generateMenu().then(() => {
  process.exit(0)
}).catch(error => {
  console.error('❌ Error fatal:', error.message)
  process.exit(1)
})
