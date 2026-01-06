# Guía de Migración a Base de Datos Online

## 🎯 Objetivo
Migrar de archivos JSON locales a una base de datos online para que los datos persistan en producción y no se pierdan en cada despliegue.

## 📊 Opciones de Base de Datos

### 1. Firebase Firestore (Recomendado para empezar)
**Ventajas:**
- ✅ Fácil de integrar con Next.js
- ✅ Plan gratuito generoso (1GB almacenamiento, 50K lecturas/día)
- ✅ Tiempo real automático
- ✅ Backups automáticos
- ✅ Autenticación integrada
- ✅ No requiere servidor propio

**Desventajas:**
- ⚠️ NoSQL (menos estructura que SQL)
- ⚠️ Costos pueden aumentar con mucho tráfico

**Costo:** Gratis hasta 1GB, luego $0.18/GB

### 2. Supabase (Recomendado para producción)
**Ventajas:**
- ✅ PostgreSQL (SQL robusto)
- ✅ Plan gratuito generoso (500MB, 2GB ancho de banda)
- ✅ API REST automática
- ✅ Autenticación integrada
- ✅ Backups automáticos
- ✅ Interfaz similar a Firebase pero con SQL

**Desventajas:**
- ⚠️ Requiere un poco más de configuración inicial

**Costo:** Gratis hasta 500MB, luego $25/mes

### 3. MongoDB Atlas
**Ventajas:**
- ✅ NoSQL flexible
- ✅ Plan gratuito (512MB)
- ✅ Fácil de usar

**Desventajas:**
- ⚠️ Menos integración con Next.js que Firebase

**Costo:** Gratis hasta 512MB

## 🚀 Recomendación: Firebase Firestore

Para este proyecto, recomendamos **Firebase Firestore** porque:
1. Es la más fácil de integrar
2. Tiene excelente soporte para Next.js
3. Permite migración gradual
4. Backups automáticos incluidos

## 📋 Plan de Migración

### Fase 1: Configuración de Firebase
1. Crear proyecto en Firebase Console
2. Habilitar Firestore Database
3. Configurar reglas de seguridad
4. Obtener credenciales

### Fase 2: Migración de Datos
1. Exportar datos actuales de JSON
2. Importar a Firestore
3. Verificar integridad

### Fase 3: Actualización del Código
1. Instalar Firebase SDK
2. Crear servicios de base de datos
3. Actualizar APIs para usar Firestore
4. Mantener compatibilidad con JSON (fallback)

### Fase 4: Backups y Monitoreo
1. Configurar backups automáticos
2. Scripts de exportación manual
3. Monitoreo de uso

## 🔧 Implementación

Ver los scripts en:
- `scripts/migrate-to-firebase.js` - Migración de datos
- `scripts/backup-firebase.js` - Backup manual
- `lib/firebase.ts` - Configuración de Firebase
- `lib/db-*.ts` - Servicios de base de datos

## 📝 Variables de Entorno

Crear archivo `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

## 🔄 Estrategia de Migración Gradual

1. **Modo Híbrido**: Leer de Firestore, escribir en ambos (Firestore + JSON)
2. **Validación**: Comparar datos entre ambos sistemas
3. **Migración completa**: Solo Firestore cuando esté validado
4. **JSON como backup**: Mantener JSON como respaldo local

## 📦 Backups

### Automáticos
- Firebase hace backups automáticos diarios
- Retención de 7 días en plan gratuito

### Manuales
- Script `backup-firebase.js` para exportar datos
- Exportar a JSON para respaldo local
- Guardar en cloud storage (Google Drive, S3, etc.)

## 🛡️ Seguridad

### Reglas de Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo lectura pública para productos
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Ventas solo para autenticados
    match /sales/{saleId} {
      allow read, write: if request.auth != null;
    }
    
    // Inventario solo para autenticados
    match /inventory/{itemId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📊 Monitoreo

- Firebase Console: Uso de almacenamiento y lecturas
- Alertas: Configurar límites de uso
- Logs: Revisar errores en Firebase Console

## 🔄 Rollback

Si necesitas volver a JSON:
1. Exportar datos de Firestore
2. Restaurar archivos JSON
3. Revertir cambios en código
4. Desplegar versión anterior

