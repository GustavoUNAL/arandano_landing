# 🔄 Restaurar Backup a Firebase

Este guía te ayudará a restaurar los datos desde un backup a Firebase Firestore.

## 📋 Requisitos Previos

1. ✅ Firebase configurado y conectado
2. ✅ Archivo `firebase-service-account.json` en la raíz del proyecto
3. ✅ Backup disponible en el directorio `backups/`

## 🚀 Restaurar Datos

### Opción 1: Restaurar desde el backup más reciente (recomendado)

```bash
npm run restore:firebase
```

Esto restaurará automáticamente desde: `backups/pre-migration/pre-migration-2026-01-06`

### Opción 2: Restaurar desde un backup específico

```bash
node scripts/restore-backup-to-firebase.js backups/production_backup_20260105_131922
```

### Opción 3: Restaurar desde la carpeta data/ (datos actuales)

```bash
npm run migrate:firebase
```

## 📂 Backups Disponibles

Los siguientes backups están disponibles:

1. **pre-migration-2026-01-06** (más reciente)
   - 451 productos
   - 1382 items de inventario
   - 62 tareas
   - Ubicación: `backups/pre-migration/pre-migration-2026-01-06/`

2. **production_backup_20260105_131922**
   - 451 productos
   - 1346 items de inventario
   - 62 tareas
   - Ubicación: `backups/production_backup_20260105_131922/`

3. **production_backup_20260105_131919**
   - Similar al anterior
   - Ubicación: `backups/production_backup_20260105_131919/`

## 🔍 Verificar Datos Restaurados

Después de restaurar, verifica los datos:

```bash
# Verificar conexión
npm run verify:firebase

# Ver datos en Firebase Console
# https://console.firebase.google.com/
```

## ⚙️ Configurar Modo de Base de Datos

Después de restaurar, actualiza tu `.env.local`:

```env
# Modo híbrido (lee de Firebase, escribe en ambos)
DB_MODE=hybrid

# O modo completo Firebase (solo Firestore)
DB_MODE=firebase
```

## 🛠️ Solución de Problemas

### Error: "No se encontró firebase-service-account.json"

1. Ve a Firebase Console > Configuración del proyecto > Cuentas de servicio
2. Genera una nueva clave privada
3. Descarga el archivo JSON
4. Guárdalo como `firebase-service-account.json` en la raíz del proyecto

### Error: "No se pudo conectar a Firebase"

1. Verifica que el archivo de credenciales sea válido
2. Verifica que el proyecto Firebase esté activo
3. Verifica que Firestore esté habilitado en Firebase Console

### Los datos no aparecen después de restaurar

1. Verifica en Firebase Console que los datos se guardaron
2. Verifica que `DB_MODE` esté configurado correctamente
3. Reinicia el servidor de desarrollo: `npm run dev`

## 📝 Notas Importantes

- ⚠️ **Los documentos con el mismo ID serán actualizados** (merge, no se sobrescriben completamente)
- ✅ Los datos existentes en Firebase **no se eliminarán**, solo se actualizarán
- 💾 Siempre haz un backup de Firebase antes de restaurar: `npm run backup:firebase`
- 🔒 Nunca subas `firebase-service-account.json` a Git

## 📞 Soporte

Si tienes problemas, revisa:
- `MIGRATION_GUIDE.md` - Guía completa de migración
- `FIREBASE_SETUP.md` - Configuración de Firebase
- `README_DATABASE.md` - Resumen de opciones de base de datos

