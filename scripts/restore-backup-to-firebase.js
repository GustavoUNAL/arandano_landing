/**
 * Script para restaurar datos desde un backup a Firebase Firestore
 * 
 * Uso:
 * node scripts/restore-backup-to-firebase.js [backup-directory]
 * 
 * Ejemplos:
 * node scripts/restore-backup-to-firebase.js
 * node scripts/restore-backup-to-firebase.js backups/pre-migration/pre-migration-2026-01-06
 * node scripts/restore-backup-to-firebase.js backups/production_backup_20260105_131922
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuración
const BACKUP_DIR = process.argv[2] || path.join(__dirname, '../backups/pre-migration/pre-migration-2026-01-06');
const COLLECTIONS = [
  { file: 'products.json', collection: 'products' },
  { file: 'inventory.json', collection: 'inventory' },
  { file: 'sales.json', collection: 'sales' },
  { file: 'expenses.json', collection: 'expenses' },
  { file: 'tasks.json', collection: 'tasks' }
];

// Verificar que el directorio de backup existe
if (!fs.existsSync(BACKUP_DIR)) {
  console.error(`❌ Error: El directorio de backup no existe: ${BACKUP_DIR}`);
  process.exit(1);
}

// Inicializar Firebase Admin
let serviceAccount;
try {
  // Intentar desde variable de entorno
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    // Intentar desde archivo
    const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    } else {
      throw new Error('No se encontró firebase-service-account.json ni variable FIREBASE_SERVICE_ACCOUNT');
    }
  }
} catch (error) {
  console.error('❌ Error cargando credenciales de Firebase:', error.message);
  console.error('\n💡 Soluciones:');
  console.error('   1. Descarga firebase-service-account.json desde Firebase Console');
  console.error('   2. O configura la variable FIREBASE_SERVICE_ACCOUNT');
  process.exit(1);
}

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

/**
 * Limpia un objeto para Firestore (elimina undefined y maneja fechas)
 */
function cleanItemForFirestore(item) {
  const cleaned = {};
  for (const [key, value] of Object.entries(item)) {
    if (value !== undefined && value !== null) {
      // Si es una fecha en formato string ISO, convertirla
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        cleaned[key] = value; // Mantener como string para compatibilidad
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Restaura una colección desde un archivo JSON
 */
async function restoreCollection(fileName, collectionName) {
  const filePath = path.join(BACKUP_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Archivo ${fileName} no encontrado en backup, saltando...`);
    return { collection: collectionName, restored: 0, skipped: true };
  }

  let data;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ Error leyendo ${fileName}:`, error.message);
    return { collection: collectionName, restored: 0, error: error.message };
  }

  // Manejar arrays y objetos únicos
  const items = Array.isArray(data) ? data : [data];
  
  if (items.length === 0) {
    console.log(`⚠️  ${collectionName}: No hay items para restaurar`);
    return { collection: collectionName, restored: 0, skipped: true };
  }

  console.log(`\n📦 Restaurando ${collectionName}...`);
  console.log(`   Items encontrados: ${items.length}`);

  let restored = 0;
  let errors = 0;
  const batchSize = 500; // Límite de Firestore por batch
  
  // Procesar en lotes
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = db.batch();
    const batchItems = items.slice(i, i + batchSize);
    
    for (const item of batchItems) {
      try {
        // Usar el ID del item o generar uno
        const itemId = item.id || `${collectionName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const docRef = db.collection(collectionName).doc(itemId);
        
        // Limpiar datos para Firestore
        const cleanItem = cleanItemForFirestore({
          ...item,
          id: itemId // Asegurar que el ID esté presente
        });
        
        batch.set(docRef, cleanItem, { merge: true }); // merge: true para no sobrescribir si ya existe
        restored++;
      } catch (error) {
        console.error(`   ⚠️  Error procesando item ${i}:`, error.message);
        errors++;
      }
    }

    try {
      await batch.commit();
      console.log(`   ✓ Lote procesado: ${batchItems.length} items (${restored}/${items.length} total)`);
    } catch (error) {
      console.error(`   ❌ Error en batch:`, error.message);
      errors++;
    }
  }

  console.log(`✅ ${collectionName}: ${restored} items restaurados${errors > 0 ? `, ${errors} errores` : ''}`);
  return { collection: collectionName, restored, errors };
}

/**
 * Verifica qué archivos están disponibles en el backup
 */
function checkBackupFiles() {
  console.log('\n📂 Archivos disponibles en el backup:');
  console.log(`   Directorio: ${BACKUP_DIR}\n`);
  
  const stats = [];
  for (const { file, collection } of COLLECTIONS) {
    const filePath = path.join(BACKUP_DIR, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : [data];
      const size = fs.statSync(filePath).size;
      stats.push({
        file,
        collection,
        exists: true,
        items: items.length,
        size: (size / 1024).toFixed(2) + ' KB'
      });
      console.log(`   ✓ ${file.padEnd(20)} → ${collection.padEnd(12)} (${items.length} items, ${(size / 1024).toFixed(2)} KB)`);
    } else {
      stats.push({ file, collection, exists: false });
      console.log(`   ✗ ${file.padEnd(20)} → ${collection.padEnd(12)} (no encontrado)`);
    }
  }
  
  return stats;
}

/**
 * Verifica conexión con Firebase
 */
async function verifyFirebaseConnection() {
  try {
    // Intentar leer una colección para verificar conexión
    const testRef = db.collection('_test');
    await testRef.limit(1).get();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Firebase:', error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RESTAURACIÓN DE BACKUP A FIREBASE FIRESTORE');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Verificar conexión con Firebase
  console.log('\n🔌 Verificando conexión con Firebase...');
  const isConnected = await verifyFirebaseConnection();
  if (!isConnected) {
    console.error('\n❌ No se pudo conectar a Firebase. Verifica tus credenciales.');
    process.exit(1);
  }
  console.log('✅ Conexión con Firebase establecida\n');
  
  // Verificar archivos en backup
  const backupStats = checkBackupFiles();
  const availableFiles = backupStats.filter(s => s.exists);
  
  if (availableFiles.length === 0) {
    console.error('\n❌ No se encontraron archivos para restaurar en el backup.');
    process.exit(1);
  }
  
  console.log(`\n📊 Resumen: ${availableFiles.length} colecciones disponibles para restaurar\n`);
  
  // Confirmar antes de restaurar (solo en modo interactivo)
  if (process.stdin.isTTY) {
    console.log('⚠️  ADVERTENCIA: Este proceso restaurará datos a Firebase.');
    console.log('   Los documentos existentes con el mismo ID serán actualizados (merge).\n');
  }
  
  // Restaurar cada colección
  const results = [];
  for (const { file, collection } of COLLECTIONS) {
    const result = await restoreCollection(file, collection);
    results.push(result);
  }
  
  // Resumen final
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  📊 RESUMEN DE RESTAURACIÓN');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  let totalRestored = 0;
  for (const result of results) {
    if (result.skipped) {
      console.log(`⚠️  ${result.collection.padEnd(15)} - Saltado (archivo no encontrado)`);
    } else if (result.error) {
      console.log(`❌ ${result.collection.padEnd(15)} - Error: ${result.error}`);
    } else {
      console.log(`✅ ${result.collection.padEnd(15)} - ${result.restored} items restaurados`);
      totalRestored += result.restored;
    }
  }
  
  console.log(`\n📦 Total: ${totalRestored} items restaurados a Firebase\n`);
  
  console.log('✅ Restauración completada');
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Verifica los datos en Firebase Console');
  console.log('   2. Actualiza DB_MODE en .env.local si es necesario');
  console.log('   3. Prueba la aplicación para confirmar que todo funciona\n');
}

// Ejecutar
main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});

