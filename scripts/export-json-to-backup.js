/**
 * Script para exportar todos los JSON a un backup antes de migrar
 * 
 * Uso: node scripts/export-json-to-backup.js
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const backupDir = path.join(__dirname, '../backups/pre-migration');

const files = [
  'products.json',
  'inventory.json',
  'sales.json',
  'expenses.json',
  'tasks.json'
];

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupPath = path.join(backupDir, `pre-migration-${timestamp}`);

  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BACKUP PRE-MIGRACIÓN');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Directorio: ${backupPath}\n`);

  let totalSize = 0;

  files.forEach(file => {
    const sourcePath = path.join(dataDir, file);
    const destPath = path.join(backupPath, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      const stats = fs.statSync(sourcePath);
      totalSize += stats.size;
      
      const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      const itemCount = Array.isArray(data) ? data.length : Object.keys(data).length;
      
      console.log(`✓ ${file.padEnd(20)} - ${itemCount.toString().padStart(4)} items - ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.log(`⚠ ${file.padEnd(20)} - NO ENCONTRADO`);
    }
  });

  // Crear resumen
  const summary = {
    date: timestamp,
    files: files.map(f => ({
      name: f,
      exists: fs.existsSync(path.join(dataDir, f)),
      size: fs.existsSync(path.join(dataDir, f)) 
        ? fs.statSync(path.join(dataDir, f)).size 
        : 0
    })),
    totalSize
  };

  fs.writeFileSync(
    path.join(backupPath, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log(`\nTotal: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`\n✓ Backup creado en: ${backupPath}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

createBackup();

