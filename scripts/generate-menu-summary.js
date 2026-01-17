/**
 * Script para generar un resumen completo del menú con todos los productos
 */

const admin = require('firebase-admin')
const path = require('path')
const fs = require('fs')

// Cargar credenciales de Firebase
let db = null
let useFirebase = false

try {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json')
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath)
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
    }
    
    db = admin.firestore()
    useFirebase = true
    console.log('✅ Firebase conectado')
  }
} catch (error) {
  console.error('❌ Error conectando a Firebase:', error.message)
  process.exit(1)
}

// Función para obtener productos
async function getProducts() {
  if (!useFirebase || !db) {
    throw new Error('Firebase no disponible')
  }
  
  const snapshot = await db.collection('products').get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Función para formatear precio
function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Función principal
async function generateMenuSummary() {
  try {
    console.log('📦 Obteniendo productos del menú...\n')
    const products = await getProducts()
    
    if (products.length === 0) {
      console.log('❌ No se encontraron productos')
      return
    }
    
    // Agrupar por tipo
    const productsByType = {
      cafeteria: [],
      bebida: []
    }
    
    products.forEach(product => {
      if (product.type === 'cafeteria') {
        productsByType.cafeteria.push(product)
      } else if (product.type === 'bebida') {
        productsByType.bebida.push(product)
      }
    })
    
    // Generar resumen
    console.log('='.repeat(80))
    console.log('📋 RESUMEN COMPLETO DEL MENÚ - ARÁNDANO CAFÉ BAR')
    console.log('='.repeat(80))
    console.log(`\n📊 Total de productos: ${products.length}`)
    console.log(`   ☕ Cafetería: ${productsByType.cafeteria.length}`)
    console.log(`   🍺 Bebidas: ${productsByType.bebida.length}\n`)
    
    // Productos de Cafetería
    if (productsByType.cafeteria.length > 0) {
      console.log('─'.repeat(80))
      console.log('☕ MENÚ DE CAFETERÍA')
      console.log('─'.repeat(80))
      
      // Agrupar por categoría
      const categories = {}
      productsByType.cafeteria.forEach(product => {
        const cat = product.category || 'Sin categoría'
        if (!categories[cat]) {
          categories[cat] = []
        }
        categories[cat].push(product)
      })
      
      Object.keys(categories).sort().forEach(category => {
        console.log(`\n📁 ${category.toUpperCase()}:`)
        console.log('─'.repeat(60))
        categories[category].forEach(product => {
          const stockInfo = product.stock !== undefined && product.stock !== null 
            ? `Stock: ${product.stock}` 
            : 'Sin stock'
          console.log(`  • ${product.name}`)
          console.log(`    Precio: ${formatPrice(product.price)} | ${stockInfo}`)
          if (product.description) {
            console.log(`    ${product.description}`)
          }
        })
      })
    }
    
    // Productos de Bebidas
    if (productsByType.bebida.length > 0) {
      console.log('\n')
      console.log('─'.repeat(80))
      console.log('🍺 MENÚ DE BEBIDAS')
      console.log('─'.repeat(80))
      
      // Agrupar por categoría
      const categories = {}
      productsByType.bebida.forEach(product => {
        const cat = product.category || 'Sin categoría'
        if (!categories[cat]) {
          categories[cat] = []
        }
        categories[cat].push(product)
      })
      
      Object.keys(categories).sort().forEach(category => {
        console.log(`\n📁 ${category.toUpperCase()}:`)
        console.log('─'.repeat(60))
        categories[category].forEach(product => {
          const stockInfo = product.stock !== undefined && product.stock !== null 
            ? `Stock: ${product.stock}` 
            : 'Sin stock'
          console.log(`  • ${product.name}`)
          console.log(`    Precio: ${formatPrice(product.price)} | ${stockInfo}`)
          if (product.description) {
            console.log(`    ${product.description}`)
          }
          if (product.size) {
            console.log(`    Tamaño: ${product.size}`)
          }
        })
      })
    }
    
    // Estadísticas
    console.log('\n')
    console.log('─'.repeat(80))
    console.log('📈 ESTADÍSTICAS DEL MENÚ')
    console.log('─'.repeat(80))
    
    const prices = products.map(p => p.price || 0)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    
    const stockProducts = products.filter(p => p.stock > 0)
    const noStockProducts = products.filter(p => !p.stock || p.stock === 0)
    
    console.log(`\n💰 Precios:`)
    console.log(`   Mínimo: ${formatPrice(minPrice)}`)
    console.log(`   Máximo: ${formatPrice(maxPrice)}`)
    console.log(`   Promedio: ${formatPrice(Math.round(avgPrice))}`)
    
    console.log(`\n📦 Stock:`)
    console.log(`   Productos con stock: ${stockProducts.length}`)
    console.log(`   Productos sin stock: ${noStockProducts.length}`)
    
    // Productos sin stock
    if (noStockProducts.length > 0) {
      console.log(`\n⚠️  Productos sin stock:`)
      noStockProducts.forEach(product => {
        console.log(`   • ${product.name} (${product.category})`)
      })
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('✅ Resumen generado exitosamente')
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Ejecutar
generateMenuSummary()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
