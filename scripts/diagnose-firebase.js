/**
 * Script de diagnóstico para verificar la configuración de Firebase en el servidor
 * 
 * Uso: node scripts/diagnose-firebase.js
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local si existe
const envLocalPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      const value = values.join('=').replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

// Función principal async
async function main() {
console.log('═══════════════════════════════════════════════════════════');
console.log('  🔍 DIAGNÓSTICO DE FIREBASE');
console.log('═══════════════════════════════════════════════════════════\n');

let issues = [];
let warnings = [];
let success = [];

// 1. Verificar DB_MODE
console.log('1️⃣  Verificando DB_MODE...');
const dbMode = process.env.DB_MODE || 'no configurado';
console.log(`   DB_MODE actual: ${dbMode}`);

if (dbMode === 'no configurado' || dbMode === 'json') {
  issues.push(`DB_MODE está configurado como '${dbMode}'. Debe ser 'firebase' o 'hybrid' para usar Firebase`);
  console.log('   ❌ DB_MODE no está configurado para usar Firebase');
} else {
  success.push(`DB_MODE está configurado como '${dbMode}' ✓`);
  console.log('   ✅ DB_MODE configurado correctamente');
}

// 2. Verificar archivo de credenciales
console.log('\n2️⃣  Verificando credenciales de Firebase...');
const credPath = path.join(__dirname, '../firebase-service-account.json');
const envCred = process.env.FIREBASE_SERVICE_ACCOUNT;

if (fs.existsSync(credPath)) {
  try {
    const cred = require(credPath);
    if (cred.project_id) {
      success.push(`Archivo firebase-service-account.json encontrado (proyecto: ${cred.project_id}) ✓`);
      console.log(`   ✅ Archivo encontrado (proyecto: ${cred.project_id})`);
    } else {
      issues.push('El archivo firebase-service-account.json existe pero no contiene project_id');
      console.log('   ❌ Archivo inválido');
    }
  } catch (error) {
    issues.push(`Error leyendo firebase-service-account.json: ${error.message}`);
    console.log(`   ❌ Error: ${error.message}`);
  }
} else if (envCred) {
  try {
    const cred = JSON.parse(envCred);
    if (cred.project_id) {
      success.push(`Credenciales encontradas en variable de entorno (proyecto: ${cred.project_id}) ✓`);
      console.log(`   ✅ Variable de entorno configurada (proyecto: ${cred.project_id})`);
    } else {
      issues.push('La variable FIREBASE_SERVICE_ACCOUNT no contiene project_id válido');
      console.log('   ❌ Variable inválida');
    }
  } catch (error) {
    issues.push(`Error parseando FIREBASE_SERVICE_ACCOUNT: ${error.message}`);
    console.log(`   ❌ Error: ${error.message}`);
  }
} else {
  issues.push('No se encontró firebase-service-account.json ni variable FIREBASE_SERVICE_ACCOUNT');
  console.log('   ❌ No se encontraron credenciales');
}

// 3. Intentar conectar a Firebase
async function checkFirebaseConnection() {
  console.log('\n3️⃣  Verificando conexión a Firebase...');
  try {
    // Verificar si firebase-admin está instalado
    let admin;
    try {
      admin = require('firebase-admin');
    } catch (requireError) {
      if (requireError.code === 'MODULE_NOT_FOUND' && requireError.message.includes('firebase-admin')) {
        issues.push('firebase-admin no está instalado. Ejecuta: npm install');
        console.log('   ❌ Error: Cannot find module \'firebase-admin\'');
        console.log('   💡 Solución: Ejecuta "npm install" para instalar las dependencias');
        return;
      }
      throw requireError;
    }
    
    let serviceAccount;
    if (envCred) {
      serviceAccount = JSON.parse(envCred);
    } else if (fs.existsSync(credPath)) {
      serviceAccount = require(credPath);
    }
    
    if (!serviceAccount) {
      console.log('   ⚠️  No se pueden probar las credenciales (no encontradas)');
      warnings.push('No se pudo probar la conexión: credenciales no encontradas');
      return;
    }
    
    // Inicializar si no está inicializado
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    const db = admin.firestore();
    
    // Intentar leer una colección
    try {
      const testRef = db.collection('_diagnostic');
      await testRef.limit(1).get();
      success.push('Conexión a Firebase establecida correctamente ✓');
      console.log('   ✅ Conexión exitosa a Firebase');
      
      // Verificar qué colecciones tienen datos
      console.log('\n4️⃣  Verificando datos en Firebase...');
      const collections = ['products', 'inventory', 'sales', 'expenses', 'tasks'];
      
      for (const collName of collections) {
        try {
          const snapshot = await db.collection(collName).limit(1).get();
          const count = snapshot.size;
          const fullSnapshot = await db.collection(collName).get();
          const totalCount = fullSnapshot.size;
          
          if (totalCount > 0) {
            success.push(`${collName}: ${totalCount} documentos encontrados ✓`);
            console.log(`   ✅ ${collName.padEnd(12)}: ${totalCount} documentos`);
          } else {
            warnings.push(`${collName}: No tiene datos`);
            console.log(`   ⚠️  ${collName.padEnd(12)}: Sin datos`);
          }
        } catch (error) {
          warnings.push(`${collName}: Error leyendo (${error.message})`);
          console.log(`   ⚠️  ${collName.padEnd(12)}: Error - ${error.message}`);
        }
      }
    } catch (error) {
      issues.push(`Error conectando a Firebase: ${error.message}`);
      console.log(`   ❌ Error: ${error.message}`);
    }
  } catch (error) {
    issues.push(`Error inicializando Firebase Admin: ${error.message}`);
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Ejecutar verificación de Firebase
await checkFirebaseConnection();

// 4. Verificar archivos JSON locales (fallback)
console.log('\n5️⃣  Verificando archivos JSON locales...');
const dataDir = path.join(__dirname, '../data');
const jsonFiles = ['products.json', 'inventory.json', 'sales.json', 'expenses.json', 'tasks.json'];

for (const file of jsonFiles) {
  const filePath = path.join(dataDir, file);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const count = Array.isArray(data) ? data.length : Object.keys(data).length;
      console.log(`   📄 ${file.padEnd(20)}: ${count} items`);
    } catch (error) {
      console.log(`   ❌ ${file.padEnd(20)}: Error leyendo`);
    }
  } else {
    console.log(`   ⚠️  ${file.padEnd(20)}: No existe`);
  }
}

// Resumen
console.log('\n═══════════════════════════════════════════════════════════');
console.log('  📊 RESUMEN');
console.log('═══════════════════════════════════════════════════════════\n');

if (success.length > 0) {
  console.log('✅ Éxitos:');
  success.forEach(msg => console.log(`   ✓ ${msg}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Advertencias:');
  warnings.forEach(msg => console.log(`   ⚠ ${msg}`));
  console.log('');
}

if (issues.length > 0) {
  console.log('❌ Problemas encontrados:');
  issues.forEach(msg => console.log(`   ✗ ${msg}`));
  console.log('');
  
  console.log('💡 Soluciones sugeridas:');
  console.log('');
  
  // Verificar si falta firebase-admin
  const missingDeps = issues.some(issue => issue.includes('firebase-admin') && issue.includes('instalado'));
  if (missingDeps) {
    console.log('1. Instala las dependencias:');
    console.log('   npm install');
    console.log('   # O si tienes package-lock.json:');
    console.log('   npm ci');
    console.log('');
  }
  
  let suggestionNum = missingDeps ? 2 : 1;
  
  if (dbMode === 'no configurado' || dbMode === 'json') {
    console.log(`${suggestionNum}. Configura DB_MODE en tu servidor:`);
    console.log('   export DB_MODE=firebase  # o hybrid');
    console.log('   # O en .env.local:');
    console.log('   echo "DB_MODE=firebase" >> .env.local');
    console.log('');
    suggestionNum++;
  }
  
  if (!fs.existsSync(credPath) && !envCred) {
    console.log(`${suggestionNum}. Configura las credenciales de Firebase:`);
    console.log('   a) Descarga firebase-service-account.json desde Firebase Console');
    console.log('   b) O configura la variable de entorno:');
    console.log('      export FIREBASE_SERVICE_ACCOUNT=\'{"type":"service_account",...}\'');
    console.log('');
    suggestionNum++;
  }
  
  console.log(`${suggestionNum}. Si Firebase está vacío, restaura desde backup:`);
  console.log('   npm run restore:firebase');
  console.log('');
} else {
  console.log('✅ Todo parece estar configurado correctamente!');
  console.log('');
  console.log('Si aún no ves datos, intenta:');
  console.log('   npm run restore:firebase');
  console.log('');
}

} // Cerrar función main()

// Ejecutar función principal
main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
