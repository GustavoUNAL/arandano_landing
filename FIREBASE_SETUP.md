# Configuración de Firebase Firestore

## 📋 Pasos para Configurar Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Ingresa el nombre: "Arándano Café Bar"
4. Desactiva Google Analytics (opcional)
5. Haz clic en "Crear proyecto"

### 2. Habilitar Firestore Database

1. En el menú lateral, ve a "Firestore Database"
2. Haz clic en "Crear base de datos"
3. Selecciona modo: **Modo de producción** (o modo de prueba para desarrollo)
4. Elige la ubicación: **us-central** (o la más cercana a Colombia)
5. Haz clic en "Habilitar"

### 3. Configurar Reglas de Seguridad

1. Ve a la pestaña "Reglas" en Firestore
2. Copia y pega las reglas de `firestore.rules` (ver abajo)
3. Haz clic en "Publicar"

### 4. Obtener Credenciales

#### Para el Cliente (Next.js)

1. Ve a "Configuración del proyecto" (ícono de engranaje)
2. En "Tus aplicaciones", haz clic en el ícono web `</>`
3. Registra la app con nombre "Arándano Web"
4. Copia las credenciales y agrégalas a `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=arandano-cafe.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=arandano-cafe
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=arandano-cafe.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

#### Para el Servidor (Admin SDK)

1. Ve a "Configuración del proyecto" > "Cuentas de servicio"
2. Haz clic en "Generar nueva clave privada"
3. Descarga el archivo JSON
4. Renómbralo a `firebase-service-account.json`
5. Colócalo en la raíz del proyecto
6. **IMPORTANTE**: Agrega `firebase-service-account.json` a `.gitignore`

### 5. Instalar Dependencias

```bash
npm install firebase firebase-admin
```

### 6. Migrar Datos

```bash
# 1. Hacer backup de JSON actual
node scripts/export-json-to-backup.js

# 2. Migrar a Firebase
node scripts/migrate-to-firebase.js

# 3. Verificar en Firebase Console
```

### 7. Actualizar Variables de Entorno

En producción (Vercel, etc.):
1. Agrega todas las variables `NEXT_PUBLIC_FIREBASE_*` en la configuración
2. Para `FIREBASE_SERVICE_ACCOUNT`, pega el contenido completo del JSON como string

## 🔒 Reglas de Seguridad (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Productos: lectura pública, escritura autenticada
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Ventas: solo autenticados
    match /sales/{saleId} {
      allow read, write: if request.auth != null;
    }
    
    // Inventario: solo autenticados
    match /inventory/{itemId} {
      allow read, write: if request.auth != null;
    }
    
    // Gastos: solo autenticados
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null;
    }
    
    // Tareas: solo autenticados
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📊 Estructura de Colecciones

```
firestore/
├── products/          (Productos a la venta)
├── inventory/         (Inventario interno)
├── sales/            (Ventas registradas)
├── expenses/         (Gastos)
└── tasks/            (Tareas)
```

## 🔄 Modos de Operación

### Modo JSON (Actual)
```env
DB_MODE=json
```
- Usa solo archivos JSON
- No requiere Firebase

### Modo Híbrido (Recomendado para migración)
```env
DB_MODE=hybrid
```
- Lee de Firestore
- Escribe en ambos (Firestore + JSON)
- Permite validación gradual

### Modo Firebase (Producción)
```env
DB_MODE=firebase
```
- Solo usa Firestore
- JSON como backup manual

## 🛡️ Seguridad en Producción

1. **Nunca** subas `firebase-service-account.json` a Git
2. Usa variables de entorno en producción
3. Configura reglas de Firestore correctamente
4. Habilita autenticación para escritura
5. Revisa logs regularmente

## 📈 Monitoreo

- Firebase Console > Usage: Ver uso de almacenamiento y lecturas
- Configurar alertas cuando se acerque al límite
- Revisar logs de errores regularmente

## 💰 Costos

**Plan Gratuito (Spark):**
- 1 GB almacenamiento
- 50,000 lecturas/día
- 20,000 escrituras/día
- 20,000 borrados/día

**Plan de Pago (Blaze):**
- $0.18/GB almacenamiento
- $0.06 por 100,000 lecturas
- $0.18 por 100,000 escrituras

Para este proyecto, el plan gratuito debería ser suficiente inicialmente.

