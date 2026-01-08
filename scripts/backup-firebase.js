/**
 * Script para hacer backup de datos de Firebase Firestore a JSON
 * 
 * Uso: node scripts/backup-firebase.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const collections = ['products', 'inventory', 'sales', 'expenses', 'tasks'];
const backupDir = path.join(__dirname, '../backups/firebase');

async function backupCollection(collectionName) {
  console.log(`\n📦 Respaldando ${collectionName}...`);
  
  const snapshot = await db.collection(collectionName).get();
  const items = snapshot.docs.map(doc => doc.data());
  
  // Crear directorio de backup si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${collectionName}_${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
  
  console.log(`   ✓ ${items.length} items respaldados`);
  console.log(`   📄 Guardado en: ${filePath}`);
  
  return { collection: collectionName, count: items.length, file: fileName };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BACKUP DE FIREBASE FIRESTORE');
  console.log('═══════════════════════════════════════════════════════════\n');

  const timestamp = new Date().toISOString().split('T')[0];
  console.log(`Fecha: ${timestamp}\n`);

  try {
    const results = [];
    
    for (const collection of collections) {
      const result = await backupCollection(collection);
      results.push(result);
    }

    // Crear resumen
    const summary = {
      date: timestamp,
      collections: results,
      total: results.reduce((sum, r) => sum + r.count, 0)
    };

    const summaryPath = path.join(backupDir, `backup_summary_${timestamp}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ BACKUP COMPLETADO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('Resumen:');
    results.forEach(r => {
      console.log(`  ${r.collection}: ${r.count} items`);
    });
    console.log(`\n  Total: ${summary.total} items`);
    console.log(`\n  Resumen guardado en: ${summaryPath}\n`);

  } catch (error) {
    console.error('❌ Error durante el backup:', error);
    process.exit(1);
  }
}

main();

