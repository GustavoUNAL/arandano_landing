#!/usr/bin/env node

/**
 * Script para limpiar archivos innecesarios y verificar que todo funcione
 * 
 * Uso: node scripts/cleanup-and-verify.js
 */

const fs = require('fs')
const path = require('path')

// Archivos y directorios a mantener (importantes)
const IMPORTANT_FILES = [
  'package.json',
  'package-lock.json',
  'next.config.js',
  'tsconfig.json',
  'tailwind.config.js',
  'postcss.config.js',
  'ecosystem.config.js',
  'firestore.rules',
  'firebase-service-account.example.json',
  '.env.local',
  '.gitignore',
  'README.md',
  'DEPLOY_EC2_COMPLETE.md',
  'DEPLOY_SERVER.md',
  'README_DEPLOY_EC2.md',
  'deploy-ec2.sh',
  'setup-domain.sh',
  'setup-ec2.sh',
  'setup-https.sh'
]

// Archivos de documentación que pueden consolidarse o eliminarse
const DOCS_TO_REVIEW = [
  'DEPLOY.md',
  'DEPLOY_OVH.md',
  'DEPLOY_V3.md',
  'EC2_DEPLOYMENT.md',
  'EC2_PRODUCTION_SETUP.md',
  'DESPLIEGUE_AUTOMATICO.md',
  'CHECKLIST_DESPLIEGUE.md',
  'PRE_DEPLOY_CHECKLIST.md',
  'BUILD_CHECKLIST_V3.md',
  'ec2-setup-checklist.md',
  'QUICK_START_EC2.md',
  'QUICK_START_DB.md',
  'README_DESPLIEGUE.md',
  'README_DATABASE.md',
  'SOLUCION_500_ERRORS.md',
  'SOLUCION_INMEDIATA.md',
  'SOLUCION_SERVIDOR_SIN_DATOS.md',
  'SOLUCION_STANDALONE.md',
  'SOLUCION_VULNERABILIDADES.md',
  'FIX_DB_MODE.md',
  'FIX_FIREBASE_PRODUCTION.md',
  'FIX_VULNERABILITIES_EC2.md',
  'VER_ERRORES_SERVIDOR.md',
  'VERIFICAR_Y_CONTINUAR.md',
  'RESOLVER_CONFLICTO_GIT.md',
  'RESOLVER_PUSH_REJECTED.md',
  'DEBUG_SALES_500.md',
  'HOW_TO_VERIFY_DATA.md',
  'VALIDATION.md',
  'VERSION_3.md',
  'PRODUCTION_READY.md',
  'CONFIGURAR_SERVIDOR_FIREBASE.md',
  'FIREBASE_CREDENTIALS_GUIDE.md',
  'FIREBASE_SETUP.md',
  'OBTENER_SERVICE_ACCOUNT.md',
  'MIGRATION_GUIDE.md',
  'RESTORE_BACKUP.md',
  'ADMIN.md'
]

// Scripts que pueden consolidarse
const SCRIPTS_TO_REVIEW = [
  'scripts/add-exito-inventory.js',
  'scripts/add-patty-inventory.js',
  'scripts/add-new-inventory-items.js',
  'scripts/fix-database-consistency.js', // Duplicado de verify-database-consistency.js
  'scripts/audit-database.js'
]

console.log('\n🧹 LIMPIEZA Y VERIFICACIÓN DEL PROYECTO\n')
console.log('═'.repeat(80))

// Verificar estructura de directorios importantes
console.log('\n📁 Verificando estructura de directorios...\n')

const requiredDirs = ['app', 'lib', 'components', 'scripts', 'deploy', 'public', 'data']
const missingDirs = []

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`   ✅ ${dir}/`)
  } else {
    console.log(`   ❌ ${dir}/ - FALTANTE`)
    missingDirs.push(dir)
  }
})

if (missingDirs.length > 0) {
  console.log(`\n⚠️  Directorios faltantes: ${missingDirs.join(', ')}`)
}

// Verificar archivos de configuración importantes
console.log('\n📄 Verificando archivos de configuración...\n')

const configFiles = [
  'package.json',
  'next.config.js',
  'tsconfig.json',
  'ecosystem.config.js',
  'firestore.rules'
]

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`)
  } else {
    console.log(`   ❌ ${file} - FALTANTE`)
  }
})

// Verificar scripts principales
console.log('\n🔧 Verificando scripts principales...\n')

const mainScripts = [
  'scripts/verify-database-consistency.js',
  'scripts/database-organization-report.js',
  'scripts/report-inventory-lots.js',
  'scripts/report-sales.js',
  'scripts/backup-firebase.js',
  'scripts/migrate-to-firebase.js',
  'deploy-ec2.sh',
  'deploy/ovh/deploy.sh',
  'deploy/ovh/full-deploy.sh'
]

mainScripts.forEach(script => {
  if (fs.existsSync(script)) {
    try {
      const content = fs.readFileSync(script, 'utf8')
      const isExecutable = fs.statSync(script).mode & parseInt('111', 8)
      console.log(`   ✅ ${script}${isExecutable ? ' (ejecutable)' : ' (necesita chmod +x)'}`)
    } catch (error) {
      console.log(`   ⚠️  ${script} - Error leyendo`)
    }
  } else {
    console.log(`   ❌ ${script} - FALTANTE`)
  }
})

// Analizar archivos de documentación duplicados
console.log('\n📚 Analizando documentación...\n')

const existingDocs = DOCS_TO_REVIEW.filter(doc => fs.existsSync(doc))
console.log(`   Total de archivos de documentación a revisar: ${existingDocs.length}`)

// Identificar archivos que pueden consolidarse
const deploymentDocs = [
  'DEPLOY.md',
  'DEPLOY_OVH.md',
  'DEPLOY_V3.md',
  'EC2_DEPLOYMENT.md',
  'EC2_PRODUCTION_SETUP.md',
  'DESPLIEGUE_AUTOMATICO.md',
  'DEPLOY_EC2_COMPLETE.md',
  'DEPLOY_SERVER.md'
]

const solutionDocs = [
  'SOLUCION_500_ERRORS.md',
  'SOLUCION_INMEDIATA.md',
  'SOLUCION_SERVIDOR_SIN_DATOS.md',
  'SOLUCION_STANDALONE.md',
  'SOLUCION_VULNERABILIDADES.md',
  'FIX_DB_MODE.md',
  'FIX_FIREBASE_PRODUCTION.md',
  'FIX_VULNERABILITIES_EC2.md'
]

console.log(`\n   📋 Documentación de deployment: ${deploymentDocs.filter(d => fs.existsSync(d)).length} archivos`)
console.log(`   📋 Documentación de soluciones: ${solutionDocs.filter(d => fs.existsSync(d)).length} archivos`)

// Verificar scripts duplicados o innecesarios
console.log('\n🔍 Analizando scripts...\n')

const existingScripts = SCRIPTS_TO_REVIEW.filter(script => fs.existsSync(script))
if (existingScripts.length > 0) {
  console.log(`   ⚠️  Scripts a revisar: ${existingScripts.length}`)
  existingScripts.forEach(script => {
    console.log(`      - ${script}`)
  })
} else {
  console.log(`   ✅ No hay scripts duplicados obvios`)
}

// Verificar backups
console.log('\n💾 Analizando backups...\n')

if (fs.existsSync('backups')) {
  const backupDirs = fs.readdirSync('backups', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  
  console.log(`   📦 Directorios de backup: ${backupDirs.length}`)
  backupDirs.forEach(dir => {
    const dirPath = path.join('backups', dir)
    const files = fs.readdirSync(dirPath)
    const totalSize = files.reduce((sum, file) => {
      try {
        return sum + fs.statSync(path.join(dirPath, file)).size
      } catch {
        return sum
      }
    }, 0)
    console.log(`      - ${dir} (${files.length} archivos, ${(totalSize / 1024).toFixed(2)} KB)`)
  })
} else {
  console.log(`   ⚠️  Directorio backups/ no encontrado`)
}

// Resumen y recomendaciones
console.log('\n' + '═'.repeat(80))
console.log('📊 RESUMEN Y RECOMENDACIONES')
console.log('═'.repeat(80))

console.log('\n✅ Estructura del proyecto:')
console.log(`   - Directorios principales: ${requiredDirs.length - missingDirs.length}/${requiredDirs.length} presentes`)
console.log(`   - Archivos de configuración: ${configFiles.filter(f => fs.existsSync(f)).length}/${configFiles.length} presentes`)
console.log(`   - Scripts principales: ${mainScripts.filter(s => fs.existsSync(s)).length}/${mainScripts.length} presentes`)

console.log('\n💡 Recomendaciones:')
console.log('   1. Consolidar documentación de deployment en un solo archivo')
console.log('   2. Consolidar documentación de soluciones en un solo archivo')
console.log('   3. Mantener solo los backups más recientes')
console.log('   4. Los scripts en deploy/archive/ pueden eliminarse si no se usan')

console.log('\n' + '═'.repeat(80))
console.log('✅ Verificación completada')
console.log('═'.repeat(80) + '\n')
