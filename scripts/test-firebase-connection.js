/**
 * Script para probar la conexión a Firebase
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('  PRUEBA DE CONEXIÓN A FIREBASE');
console.log('═══════════════════════════════════════════════════════════\n');

// Verificar variables de entorno
console.log('📋 Verificando credenciales del cliente...');
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let envOk = true;
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✓ ${varName}`);
  } else {
    console.log(`  ✗ ${varName} - FALTA`);
    envOk = false;
  }
});

console.log('');

// Verificar Service Account
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
let serviceAccountOk = false;

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('📋 Verificando Service Account...');
    console.log(`  ✓ Archivo existe`);
    console.log(`  ✓ Project ID: ${serviceAccount.project_id}`);
    console.log(`  ✓ Client Email: ${serviceAccount.client_email}`);
    serviceAccountOk = true;
  } catch (error) {
    console.log('  ✗ Error leyendo Service Account:', error.message);
  }
} else {
  console.log('📋 Service Account:');
  console.log('  ⚠️  firebase-service-account.json no encontrado');
  console.log('  Necesario para operaciones del servidor');
}

console.log('');

// Probar conexión si tenemos Service Account
if (serviceAccountOk && envOk) {
  (async () => {
    try {
      console.log('🔌 Probando conexión a Firestore...');
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(require(serviceAccountPath))
        });
      }
      
      const db = admin.firestore();
      
      // Intentar leer una colección (aunque esté vacía)
      const testRef = db.collection('_test_connection');
      await testRef.limit(1).get();
      
      console.log('  ✅ Conexión exitosa a Firestore!');
      console.log(`  ✅ Proyecto: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('  ✅ TODO LISTO PARA MIGRAR');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      console.log('Próximos pasos:');
      console.log('1. npm run backup:json (backup de datos actuales)');
      console.log('2. npm run migrate:firebase (migrar datos)');
      console.log('3. Cambiar DB_MODE=hybrid en .env.local\n');
      
    } catch (error) {
      console.log('  ❌ Error de conexión:', error.message);
      console.log('\nVerifica:');
      console.log('  - Que Firestore esté habilitado en Firebase Console');
      console.log('  - Que las reglas de seguridad permitan acceso');
      console.log('  - Que el Service Account tenga permisos\n');
      process.exit(1);
    }
  })();
} else {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ⚠️  CONFIGURACIÓN INCOMPLETA');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (!serviceAccountOk) {
    console.log('Para obtener el Service Account:');
    console.log('1. Ve a: https://console.firebase.google.com/project/arandanocafe/settings/serviceaccounts/adminsdk');
    console.log('2. Haz clic en "Generar nueva clave privada"');
    console.log('3. Descarga el JSON y renómbralo a firebase-service-account.json');
    console.log('4. Colócalo en la raíz del proyecto\n');
  }
  
  if (!envOk) {
    console.log('Faltan variables de entorno en .env.local\n');
  }
}

