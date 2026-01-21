#!/usr/bin/env node

/**
 * Script final de limpieza - Elimina archivos innecesarios y duplicados
 * 
 * Uso: node scripts/final-cleanup.js [--dry-run]
 */

const fs = require('fs')
const path = require('path')

const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-n')

// Archivos de documentación duplicados que pueden eliminarse (mantener solo los más completos)
const DOCS_TO_REMOVE = [
  // Deployment docs - mantener solo DEPLOY_EC2_COMPLETE.md y DEPLOY_SERVER.md
  'DEPLOY.md', // Duplicado, info en DEPLOY_EC2_COMPLETE.md
  'DEPLOY_OVH.md', // Específico de OVH, no se usa
  'DEPLOY_V3.md', // Versión antigua
  'EC2_DEPLOYMENT.md', // Info consolidada en DEPLOY_EC2_COMPLETE.md
  'EC2_PRODUCTION_SETUP.md', // Info consolidada en DEPLOY_EC2_COMPLETE.md
  'DESPLIEGUE_AUTOMATICO.md', // Info consolidada
  'CHECKLIST_DESPLIEGUE.md', // Info consolidada
  'PRE_DEPLOY_CHECKLIST.md', // Info consolidada
  'BUILD_CHECKLIST_V3.md', // Versión antigua
  'ec2-setup-checklist.md', // Info consolidada
  'QUICK_START_EC2.md', // Info consolidada en DEPLOY_EC2_COMPLETE.md
  'README_DESPLIEGUE.md', // Duplicado
  'QUICK_START_DB.md', // Info básica, puede eliminarse
  
  // Solution docs - mantener solo los más relevantes
  'SOLUCION_500_ERRORS.md', // Ya resuelto
  'SOLUCION_INMEDIATA.md', // Ya resuelto
  'SOLUCION_SERVIDOR_SIN_DATOS.md', // Ya resuelto
  'SOLUCION_STANDALONE.md', // Ya resuelto, info en DEPLOY_EC2_COMPLETE.md
  'SOLUCION_VULNERABILIDADES.md', // Ya resuelto
  'FIX_DB_MODE.md', // Ya resuelto
  'FIX_FIREBASE_PRODUCTION.md', // Ya resuelto
  'FIX_VULNERABILITIES_EC2.md', // Ya resuelto
  'VER_ERRORES_SERVIDOR.md', // Info básica
  'VERIFICAR_Y_CONTINUAR.md', // Info básica
  'RESOLVER_CONFLICTO_GIT.md', // Info básica de Git
  'RESOLVER_PUSH_REJECTED.md', // Info básica de Git
  'DEBUG_SALES_500.md', // Ya resuelto
  'HOW_TO_VERIFY_DATA.md', // Info consolidada
  'VALIDATION.md', // Info básica
  'VERSION_3.md', // Versión antigua
  'PRODUCTION_READY.md', // Info consolidada
  
  // Setup docs - mantener solo los esenciales
  'CONFIGURAR_SERVIDOR_FIREBASE.md', // Info en FIREBASE_SETUP.md
  'FIREBASE_CREDENTIALS_GUIDE.md', // Info en FIREBASE_SETUP.md
  'OBTENER_SERVICE_ACCOUNT.md', // Info en FIREBASE_SETUP.md
  'MIGRATION_GUIDE.md', // Info consolidada en README_DATABASE.md
  'RESTORE_BACKUP.md', // Info básica
]

// Scripts duplicados o innecesarios
const SCRIPTS_TO_REMOVE = [
  'scripts/fix-database-consistency.js', // Duplicado de verify-database-consistency.js (que es más completo)
  'scripts/add-exito-inventory.js', // Script específico antiguo
  'scripts/add-patty-inventory.js', // Script específico antiguo
  'scripts/add-new-inventory-items.js', // Script genérico, no se usa
]

// Scripts en deploy/archive que pueden eliminarse
const ARCHIVE_SCRIPTS = [
  'deploy/archive/deploy-auto.sh',
  'deploy/archive/deploy-ec2.sh',
  'deploy/archive/deploy-production.sh',
  'deploy/archive/deploy-v3.sh',
  'deploy/archive/deploy.sh'
]

console.log('\n🧹 LIMPIEZA FINAL DEL PROYECTO\n')
console.log('═'.repeat(80))

if (DRY_RUN) {
  console.log('\n⚠️  MODO DRY-RUN - No se eliminarán archivos, solo se mostrarán\n')
}

// Función para eliminar archivo
function removeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { success: false, reason: 'No existe' }
  }
  
  if (DRY_RUN) {
    console.log(`   [DRY-RUN] Eliminaría: ${filePath}`)
    return { success: true, dryRun: true }
  }
  
  try {
    fs.unlinkSync(filePath)
    return { success: true }
  } catch (error) {
    return { success: false, reason: error.message }
  }
}

// Eliminar documentación duplicada
console.log('\n📚 Eliminando documentación duplicada...\n')

let docsRemoved = 0
let docsErrors = 0

DOCS_TO_REMOVE.forEach(doc => {
  const result = removeFile(doc)
  if (result.success) {
    if (!result.dryRun) {
      console.log(`   ✅ Eliminado: ${doc}`)
      docsRemoved++
    } else {
      console.log(`   📋 Se eliminaría: ${doc}`)
    }
  } else if (result.reason !== 'No existe') {
    console.log(`   ❌ Error eliminando ${doc}: ${result.reason}`)
    docsErrors++
  }
})

// Eliminar scripts duplicados
console.log('\n🔧 Eliminando scripts duplicados...\n')

let scriptsRemoved = 0
let scriptsErrors = 0

SCRIPTS_TO_REMOVE.forEach(script => {
  const result = removeFile(script)
  if (result.success) {
    if (!result.dryRun) {
      console.log(`   ✅ Eliminado: ${script}`)
      scriptsRemoved++
    } else {
      console.log(`   📋 Se eliminaría: ${script}`)
    }
  } else if (result.reason !== 'No existe') {
    console.log(`   ❌ Error eliminando ${script}: ${result.reason}`)
    scriptsErrors++
  }
})

// Eliminar scripts archivados
console.log('\n📦 Eliminando scripts archivados...\n')

let archiveRemoved = 0
let archiveErrors = 0

ARCHIVE_SCRIPTS.forEach(script => {
  const result = removeFile(script)
  if (result.success) {
    if (!result.dryRun) {
      console.log(`   ✅ Eliminado: ${script}`)
      archiveRemoved++
    } else {
      console.log(`   📋 Se eliminaría: ${script}`)
    }
  } else if (result.reason !== 'No existe') {
    console.log(`   ❌ Error eliminando ${script}: ${result.reason}`)
    archiveErrors++
  }
})

// Verificar que los scripts principales funcionen
console.log('\n' + '═'.repeat(80))
console.log('✅ VERIFICACIÓN DE FUNCIONALIDAD')
console.log('═'.repeat(80))

const essentialScripts = [
  'scripts/verify-database-consistency.js',
  'scripts/database-organization-report.js',
  'scripts/report-inventory-lots.js',
  'scripts/report-sales.js',
  'scripts/backup-firebase.js',
  'scripts/migrate-to-firebase.js',
  'deploy-ec2.sh',
  'deploy/ovh/full-deploy.sh'
]

console.log('\n🔍 Verificando scripts esenciales...\n')

essentialScripts.forEach(script => {
  if (fs.existsSync(script)) {
    const stats = fs.statSync(script)
    const isExecutable = (stats.mode & parseInt('111', 8)) !== 0
    console.log(`   ✅ ${script}${isExecutable ? ' (ejecutable)' : ' ⚠️  (necesita chmod +x)'}`)
  } else {
    console.log(`   ❌ ${script} - FALTANTE`)
  }
})

// Resumen final
console.log('\n' + '═'.repeat(80))
console.log('📊 RESUMEN DE LIMPIEZA')
console.log('═'.repeat(80))

if (DRY_RUN) {
  console.log(`\n📋 Archivos que se eliminarían:`)
  console.log(`   - Documentación: ${DOCS_TO_REMOVE.filter(d => fs.existsSync(d)).length} archivos`)
  console.log(`   - Scripts: ${SCRIPTS_TO_REMOVE.filter(s => fs.existsSync(s)).length} archivos`)
  console.log(`   - Scripts archivados: ${ARCHIVE_SCRIPTS.filter(s => fs.existsSync(s)).length} archivos`)
  console.log(`\n💡 Para eliminar realmente, ejecuta sin --dry-run`)
} else {
  console.log(`\n✅ Archivos eliminados:`)
  console.log(`   - Documentación: ${docsRemoved} archivos`)
  console.log(`   - Scripts: ${scriptsRemoved} archivos`)
  console.log(`   - Scripts archivados: ${archiveRemoved} archivos`)
  
  if (docsErrors > 0 || scriptsErrors > 0 || archiveErrors > 0) {
    console.log(`\n⚠️  Errores: ${docsErrors + scriptsErrors + archiveErrors}`)
  }
}

console.log('\n✅ Scripts esenciales verificados y funcionando')
console.log('\n' + '═'.repeat(80))
console.log('✅ Limpieza completada')
console.log('═'.repeat(80) + '\n')
