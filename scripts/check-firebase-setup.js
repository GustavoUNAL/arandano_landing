/**
 * Script para verificar que Firebase esté configurado correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('  VERIFICACIÓN DE CONFIGURACIÓN FIREBASE');
console.log('═══════════════════════════════════════════════════════════\n');

let allGood = true;

// Verificar archivo .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  console.log('📄 Verificando .env.local...');
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`  ✓ ${varName}`);
    } else {
      console.log(`  ✗ ${varName} - FALTA`);
      allGood = false;
    }
  });
} else {
  console.log('✗ .env.local no encontrado');
  console.log('  Crea este archivo con las credenciales de Firebase');
  allGood = false;
}

console.log('');

// Verificar firebase-service-account.json
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('📄 Verificando firebase-service-account.json...');
    console.log(`  ✓ Archivo existe`);
    console.log(`  ✓ Project ID: ${serviceAccount.project_id || 'N/A'}`);
    console.log(`  ✓ Client Email: ${serviceAccount.client_email || 'N/A'}`);
  } catch (error) {
    console.log('✗ firebase-service-account.json tiene errores:');
    console.log(`  ${error.message}`);
    allGood = false;
  }
} else {
  console.log('✗ firebase-service-account.json no encontrado');
  console.log('  Descárgalo desde Firebase Console > Cuentas de servicio');
  allGood = false;
}

console.log('');

if (allGood) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ TODO CONFIGURADO CORRECTAMENTE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\nPróximos pasos:');
  console.log('1. npm install (si no lo has hecho)');
  console.log('2. npm run backup:json (backup de datos actuales)');
  console.log('3. npm run migrate:firebase (migrar datos)');
  console.log('4. Cambiar DB_MODE=hybrid en .env.local\n');
} else {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ⚠️  FALTAN CONFIGURACIONES');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\nSigue la guía en FIREBASE_CREDENTIALS_GUIDE.md\n');
  process.exit(1);
}
