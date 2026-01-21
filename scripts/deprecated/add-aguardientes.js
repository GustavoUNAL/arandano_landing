#!/usr/bin/env node

/**
 * Script para agregar productos de aguardiente
 * 
 * Uso: node scripts/add-aguardientes.js
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

// Productos a agregar
const productos = [
  {
    name: 'Aguardiente Amarillo',
    price: 60000,
    description: 'Aguardiente Amarillo 750ml',
    category: 'vodka', // Usando vodka como categoría para aguardientes
    type: 'bebida',
    stock: 999,
    size: '750ml',
    imageUrl: ''
  },
  {
    name: 'Aguardiente Nariño',
    price: 60000,
    description: 'Aguardiente Nariño 750ml',
    category: 'vodka', // Usando vodka como categoría para aguardientes
    type: 'bebida',
    stock: 999,
    size: '750ml',
    imageUrl: ''
  }
]

// Función para formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Función principal
async function addAguardientes() {
  console.log('\n🍾 AGREGANDO PRODUCTOS DE AGUARDIENTE\n')
  console.log('═'.repeat(80))
  
  try {
    const db = initializeFirebase()
    
    for (const producto of productos) {
      console.log(`\n📦 Agregando: ${producto.name}`)
      console.log(`   Precio: ${formatCurrency(producto.price)}`)
      console.log(`   Tamaño: ${producto.size}`)
      console.log(`   Categoría: ${producto.category}`)
      console.log(`   Tipo: ${producto.type}`)
      
      try {
        const productId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const productData = {
          id: productId,
          name: producto.name,
          price: producto.price,
          description: producto.description,
          category: producto.category,
          type: producto.type,
          stock: producto.stock,
          size: producto.size,
          imageUrl: producto.imageUrl
        }
        
        await db.collection('products').doc(productId).set(productData)
        
        console.log(`   ✅ Producto agregado correctamente`)
        console.log(`   ID: ${productId}`)
        
        // Pequeña pausa entre productos
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`   ❌ Error agregando producto:`, error.message)
        throw error
      }
    }
    
    console.log('\n' + '═'.repeat(80))
    console.log('📊 RESUMEN')
    console.log('═'.repeat(80))
    console.log(`\n✅ ${productos.length} productos agregados exitosamente`)
    productos.forEach(p => {
      console.log(`   • ${p.name} - ${formatCurrency(p.price)} (${p.size})`)
    })
    
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
addAguardientes()
