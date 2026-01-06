/**
 * Script de verificación pre-despliegue
 * Verifica que todo esté listo para producción
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('  VERIFICACIÓN PRE-DESPLIEGUE');
console.log('═══════════════════════════════════════════════════════════\n');

let allGood = true;
const errors = [];
const warnings = [];

// 1. Verificar build
console.log('1️⃣  Verificando build...');
if (fs.existsSync(path.join(__dirname, '../.next'))) {
  console.log('  ✅ Build existe (.next/)');
} else {
  console.log('  ❌ Build no encontrado');
  errors.push('Ejecuta: npm run build');
  allGood = false;
}

// 2. Verificar variables de entorno
console.log('\n2️⃣  Verificando variables de entorno...');
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'DB_MODE',
    'ADMIN_PASSWORD'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`  ✅ ${varName}`);
    } else {
      console.log(`  ❌ ${varName} - FALTA`);
      errors.push(`Variable ${varName} no encontrada en .env.local`);
      allGood = false;
    }
  });
  
  // Verificar DB_MODE
  if (envContent.includes('DB_MODE=firebase') || envContent.includes('DB_MODE=hybrid')) {
    console.log('  ✅ DB_MODE configurado para Firebase');
  } else {
    warnings.push('DB_MODE está en "json", considera cambiar a "firebase" para producción');
  }
} else {
  console.log('  ❌ .env.local no encontrado');
  errors.push('Crea .env.local con las variables de Firebase');
  allGood = false;
}

// 3. Verificar Service Account
console.log('\n3️⃣  Verificando Service Account...');
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('  ✅ firebase-service-account.json existe');
    console.log(`  ✅ Project ID: ${serviceAccount.project_id || 'N/A'}`);
  } catch (error) {
    console.log('  ❌ Error leyendo Service Account:', error.message);
    errors.push('firebase-service-account.json tiene errores');
    allGood = false;
  }
} else {
  console.log('  ⚠️  firebase-service-account.json no encontrado');
  warnings.push('Necesario para operaciones del servidor. Puedes usar FIREBASE_SERVICE_ACCOUNT en .env.local');
}

// 4. Verificar archivos de datos
console.log('\n4️⃣  Verificando archivos de datos...');
const dataDir = path.join(__dirname, '../data');
const dataFiles = ['products.json', 'inventory.json', 'sales.json', 'expenses.json', 'tasks.json'];
let totalItems = 0;

dataFiles.forEach(file => {
  const filePath = path.join(dataDir, file);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const count = Array.isArray(data) ? data.length : Object.keys(data).length;
      totalItems += count;
      console.log(`  ✅ ${file.padEnd(20)} - ${count.toString().padStart(4)} items`);
    } catch (error) {
      console.log(`  ❌ ${file.padEnd(20)} - Error: ${error.message}`);
      errors.push(`${file} tiene errores de sintaxis`);
      allGood = false;
    }
  } else {
    console.log(`  ⚠️  ${file.padEnd(20)} - No encontrado`);
    warnings.push(`${file} no encontrado (puede estar bien si usas solo Firebase)`);
  }
});

console.log(`\n  Total: ${totalItems} items en archivos JSON`);

// 5. Verificar dependencias
console.log('\n5️⃣  Verificando dependencias...');
const packageJsonPath = path.join(__dirname, '../package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['firebase', 'firebase-admin'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep} instalado`);
    } else {
      console.log(`  ❌ ${dep} no encontrado en package.json`);
      errors.push(`Dependencia ${dep} falta en package.json`);
      allGood = false;
    }
  });
}

// 6. Verificar backups
console.log('\n6️⃣  Verificando backups...');
const backupDir = path.join(__dirname, '../backups');
if (fs.existsSync(backupDir)) {
  const backups = fs.readdirSync(backupDir).filter(f => 
    fs.statSync(path.join(backupDir, f)).isDirectory()
  );
  console.log(`  ✅ Directorio de backups existe (${backups.length} backups)`);
} else {
  console.log('  ⚠️  Directorio de backups no encontrado');
  warnings.push('Crea backups antes de desplegar');
}

// Resumen
console.log('\n═══════════════════════════════════════════════════════════');
if (allGood && errors.length === 0) {
  console.log('  ✅ TODO LISTO PARA PRODUCCIÓN');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (warnings.length > 0) {
    console.log('⚠️  Advertencias:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }
  
  console.log('Próximos pasos:');
  console.log('1. Subir proyecto a EC2');
  console.log('2. Configurar .env.local en el servidor');
  console.log('3. Subir firebase-service-account.json');
  console.log('4. Ejecutar: npm install && npm run build');
  console.log('5. Iniciar con PM2: pm2 start npm --name "arandano-app" -- start');
  console.log('6. Configurar Nginx (ver EC2_PRODUCTION_SETUP.md)\n');
} else {
  console.log('  ❌ HAY PROBLEMAS QUE RESOLVER');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (errors.length > 0) {
    console.log('❌ Errores:');
    errors.forEach(e => console.log(`   - ${e}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Advertencias:');
    warnings.forEach(w => console.log(`   - ${w}`));
    console.log('');
  }
  
  process.exit(1);
}

