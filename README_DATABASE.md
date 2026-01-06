# 🗄️ Migración a Base de Datos Online

## 🎯 Resumen Rápido

Este proyecto puede usar **Firebase Firestore** para almacenar datos en la nube, evitando que se pierdan en cada despliegue.

## ⚡ Inicio Rápido

### Opción 1: Firebase Firestore (Recomendado)

```bash
# 1. Instalar dependencias
npm install firebase firebase-admin

# 2. Configurar Firebase (ver FIREBASE_SETUP.md)
# - Crear proyecto en Firebase Console
# - Obtener credenciales
# - Agregar a .env.local

# 3. Hacer backup de datos actuales
npm run backup:json

# 4. Migrar datos a Firebase
npm run migrate:firebase

# 5. Cambiar modo a 'hybrid' o 'firebase' en .env.local
DB_MODE=hybrid
```

### Opción 2: Mantener JSON (Actual)

Si prefieres mantener JSON por ahora:
- Los datos se guardan en `data/*.json`
- Haz backups manuales antes de cada despliegue
- Usa `npm run backup:json` para crear backups

## 📚 Documentación Completa

- **MIGRATION_GUIDE.md** - Guía completa de migración
- **FIREBASE_SETUP.md** - Pasos detallados para configurar Firebase
- **scripts/** - Scripts de migración y backup

## 🔄 Modos de Operación

### `DB_MODE=json` (Por defecto)
- Usa archivos JSON locales
- No requiere configuración adicional
- Datos se pierden en despliegues sin backup

### `DB_MODE=hybrid` (Recomendado para migración)
- Lee de Firebase
- Escribe en ambos (Firestore + JSON)
- Permite validación gradual
- JSON como backup automático

### `DB_MODE=firebase` (Producción)
- Solo usa Firebase Firestore
- Datos persistentes en la nube
- Backups automáticos de Firebase
- Requiere configuración completa

## 🛠️ Scripts Disponibles

```bash
# Backup de JSON antes de migrar
npm run backup:json

# Migrar datos a Firebase
npm run migrate:firebase

# Backup de Firebase a JSON
npm run backup:firebase
```

## 🔒 Seguridad

- **Nunca** subas `firebase-service-account.json` a Git
- Usa variables de entorno en producción
- Configura reglas de Firestore correctamente

## 💡 Recomendación

Para producción, usa **Firebase Firestore** con modo `hybrid` inicialmente, luego cambia a `firebase` cuando estés seguro.

