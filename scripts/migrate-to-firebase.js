/**
 * Script para migrar datos de JSON a Firebase Firestore
 * 
 * Uso:
 * 1. Configurar Firebase (ver MIGRATION_GUIDE.md)
 * 2. npm install firebase-admin
 * 3. node scripts/migrate-to-firebase.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin (requiere archivo de credenciales)
// Descargar desde Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Rutas de archivos JSON
const dataDir = path.join(__dirname, '../data');
const collections = [
  { file: 'products.json', collection: 'products' },
  { file: 'inventory.json', collection: 'inventory' },
  { file: 'sales.json', collection: 'sales' },
  { file: 'expenses.json', collection: 'expenses' },
  { file: 'tasks.json', collection: 'tasks' }
];

async function migrateCollection(fileName, collectionName) {
  const filePath = path.join(dataDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo ${fileName} no encontrado, saltando...`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const items = Array.isArray(data) ? data : [data];
  
  console.log(`\n📦 Migrando ${collectionName}...`);
  console.log(`   Items encontrados: ${items.length}`);

  const batch = db.batch();
  let count = 0;
  const batchSize = 500; // Límite de Firestore

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const docRef = db.collection(collectionName).doc(item.id || `item-${i}`);
    
    // Preparar datos (Firestore no acepta undefined)
    const cleanItem = Object.fromEntries(
      Object.entries(item).filter(([_, v]) => v !== undefined)
    );
    
    batch.set(docRef, cleanItem);
    count++;

    // Firestore limita batches a 500 operaciones
    if (count >= batchSize || i === items.length - 1) {
      await batch.commit();
      console.log(`   ✓ Migrados ${Math.min(count, items.length)} items`);
      count = 0;
    }
  }

  console.log(`✅ ${collectionName} migrado exitosamente`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  MIGRACIÓN A FIREBASE FIRESTORE');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    for (const { file, collection } of collections) {
      await migrateCollection(file, collection);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ MIGRACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('Próximos pasos:');
    console.log('1. Verificar datos en Firebase Console');
    console.log('2. Actualizar código para usar Firestore');
    console.log('3. Probar en desarrollo');
    console.log('4. Desplegar a producción\n');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

main();

