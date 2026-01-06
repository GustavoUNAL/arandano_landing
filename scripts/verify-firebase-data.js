/**
 * Script para verificar que los datos estén en Firebase Firestore
 * Muestra resumen de todas las colecciones y sus documentos
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('  VERIFICACIÓN DE DATOS EN FIREBASE FIRESTORE');
console.log('═══════════════════════════════════════════════════════════\n');

// Inicializar Firebase Admin
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.log('❌ firebase-service-account.json no encontrado');
  console.log('   Necesitas el Service Account para verificar los datos\n');
  process.exit(1);
}

(async () => {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath))
      });
    }

    const db = admin.firestore();
    const collections = ['products', 'inventory', 'sales', 'expenses', 'tasks'];

    console.log(`📊 Proyecto: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'arandanocafe'}\n`);

    let totalDocuments = 0;
    const results = [];

    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        const count = snapshot.size;
        totalDocuments += count;

      results.push({
        collection: collectionName,
        count,
        documents: snapshot.docs.slice(0, 3).map(doc => ({
          id: doc.id,
          data: doc.data()
        }))
      });

      // Mostrar resumen
      console.log(`📦 ${collectionName.padEnd(15)}: ${count.toString().padStart(4)} documentos`);
      
      // Mostrar ejemplos si hay datos
      if (count > 0 && snapshot.docs.length > 0) {
        const firstDoc = snapshot.docs[0].data();
        const nameField = firstDoc.name || firstDoc.productName || firstDoc.title || 'N/A';
        console.log(`   └─ Ejemplo: ${nameField.substring(0, 50)}${nameField.length > 50 ? '...' : ''}`);
      }
    } catch (error) {
      console.log(`❌ ${collectionName.padEnd(15)}: Error - ${error.message}`);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`📊 Total documentos: ${totalDocuments}`);
  console.log('─'.repeat(60));

  // Comparar con datos locales
  console.log('\n📋 Comparación con datos locales:\n');
  
  const dataDir = path.join(__dirname, '../data');
  const localFiles = {
    products: 'products.json',
    inventory: 'inventory.json',
    sales: 'sales.json',
    expenses: 'expenses.json',
    tasks: 'tasks.json'
  };

  for (const [collection, fileName] of Object.entries(localFiles)) {
    const filePath = path.join(dataDir, fileName);
    if (fs.existsSync(filePath)) {
      try {
        const localData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const localCount = Array.isArray(localData) ? localData.length : Object.keys(localData).length;
        const firebaseCount = results.find(r => r.collection === collection)?.count || 0;
        
        const status = firebaseCount === localCount ? '✅' : firebaseCount < localCount ? '⚠️' : 'ℹ️';
        console.log(`${status} ${collection.padEnd(15)}: Local: ${localCount.toString().padStart(4)} | Firebase: ${firebaseCount.toString().padStart(4)}`);
        
        if (firebaseCount !== localCount) {
          const diff = localCount - firebaseCount;
          console.log(`   └─ Diferencia: ${Math.abs(diff)} documentos ${diff > 0 ? 'faltantes' : 'adicionales'} en Firebase`);
        }
      } catch (error) {
        console.log(`❌ ${collection.padEnd(15)}: Error leyendo archivo local`);
      }
    }
  }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ VERIFICACIÓN COMPLETA');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('💡 También puedes verificar en Firebase Console:');
    console.log(`   https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'arandanocafe'}/firestore\n`);

  } catch (error) {
    console.error('❌ Error verificando datos:', error.message);
    console.error('\nVerifica:');
    console.error('  - Que Firestore esté habilitado');
    console.error('  - Que el Service Account tenga permisos');
    console.error('  - Que las reglas de seguridad permitan lectura\n');
    process.exit(1);
  }
})();

