# ✅ Verificación de Registro de Ventas en OVH

Guía para asegurar que las ventas se puedan registrar correctamente en el servidor OVH.

## 🔍 Verificación Pre-Despliegue

### 1. Verificar Configuración de Firebase

En tu servidor OVH, ejecuta:

```bash
cd ~/projects/arandano

# Verificar variables de entorno
cat .env.local | grep FIREBASE
cat .env.local | grep DB_MODE

# Debe mostrar:
# DB_MODE=firebase
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
# NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 2. Verificar Archivo de Credenciales

```bash
# Verificar que existe
ls -la firebase-service-account.json

# Verificar permisos (debe ser 600)
chmod 600 firebase-service-account.json

# Verificar formato (debe mostrar JSON válido)
head -n 5 firebase-service-account.json
```

### 3. Ejecutar Diagnóstico de Firebase

```bash
npm run diagnose:firebase
```

Debe mostrar:
- ✅ Conexión exitosa a Firebase
- ✅ Firestore accesible
- ✅ Permisos correctos

### 4. Probar Registro de Venta (Script de Prueba)

```bash
# Ejecutar script de prueba
node scripts/test-sales-ovh.js
```

Este script:
- ✅ Verifica conexión a Firebase
- ✅ Crea una venta de prueba
- ✅ Verifica que se guardó correctamente
- ✅ Limpia la venta de prueba

**Importante:** Las reglas de Firestore requieren autenticación para clientes, pero **NO afectan las API routes del servidor** que usan `firebase-admin` con el Service Account. El código usa `firebase-admin` en el servidor, así que las ventas funcionarán correctamente.

### 4. Verificar Reglas de Firestore

Las reglas de Firestore deben permitir escritura en la colección `sales`.

**En Firebase Console:**
1. Ve a Firebase Console > Firestore Database > Rules
2. Verifica que tienes reglas similares a:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Ventas: permitir lectura y escritura (en producción, restringe según necesidad)
    match /sales/{saleId} {
      allow read, write: if true;
      // O para producción más segura:
      // allow read, write: if request.auth != null;
    }
    
    // Productos: lectura pública, escritura autenticada
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Nota:** Para desarrollo/pruebas, puedes permitir escritura pública. Para producción, considera usar autenticación.

---

## 🧪 Prueba de Registro de Venta

### Opción 1: Prueba desde la Aplicación

1. Accede a la aplicación en tu servidor OVH
2. Ve a la página del mesero (`/waiter`)
3. Agrega productos al carrito
4. Realiza un pago
5. Verifica que la venta se registra correctamente

### Opción 2: Prueba con cURL

```bash
# Desde el servidor OVH
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "cafe-negro",
        "productName": "Café negro artesanal",
        "quantity": 1,
        "unitPrice": 4000
      }
    ],
    "total": 4000,
    "subtotal": 4000,
    "channel": "presencial",
    "paymentMethod": "efectivo"
  }'
```

**Respuesta esperada:**
```json
{
  "id": "sale-1234567890-abc123",
  "date": "2026-01-11T...",
  "items": [...],
  "total": 4000,
  ...
}
```

### Opción 3: Verificar Logs

```bash
# Ver logs de PM2 en tiempo real
pm2 logs arandano-app --lines 50

# Buscar mensajes de ventas
pm2 logs arandano-app | grep -i "venta\|sale"
```

Deberías ver mensajes como:
- `[API] Creando venta con items: 1`
- `[API] Venta creada exitosamente: sale-...`
- `[API] Producto cafe-negro actualizado`

---

## 🔧 Solución de Problemas

### Error: "Firebase no disponible pero DB_MODE es firebase"

**Causa:** Firebase no está configurado correctamente.

**Solución:**
```bash
# Verificar que el archivo existe
ls -la firebase-service-account.json

# Verificar formato JSON
node -e "console.log(require('./firebase-service-account.json').project_id)"

# Ejecutar diagnóstico
npm run diagnose:firebase
```

### Error: "Permission denied" al crear venta

**Causa:** Las reglas de Firestore no permiten escritura.

**Solución:**
1. Ve a Firebase Console > Firestore Database > Rules
2. Actualiza las reglas para permitir escritura en `sales`
3. Publish las reglas

### Error: "Product not found" al actualizar stock

**Causa:** El producto no existe en Firebase.

**Solución:**
```bash
# Verificar productos en Firebase
npm run diagnose:firebase

# O migrar productos a Firebase si no están
npm run migrate:firebase
```

### La venta se registra pero no aparece en la interfaz

**Causa:** Problema con la lectura de ventas.

**Solución:**
```bash
# Verificar que las reglas permiten lectura
# En Firebase Console, verifica las reglas de Firestore

# Probar lectura directamente
curl http://localhost:3000/api/sales
```

---

## ✅ Checklist Final

Antes de considerar que las ventas funcionan correctamente:

- [ ] `DB_MODE=firebase` en `.env.local`
- [ ] Variables de Firebase configuradas en `.env.local`
- [ ] `firebase-service-account.json` existe y tiene permisos 600
- [ ] Diagnóstico de Firebase exitoso: `npm run diagnose:firebase`
- [ ] Reglas de Firestore permiten escritura en `sales`
- [ ] Prueba de venta exitosa desde la aplicación
- [ ] Prueba de venta exitosa con cURL
- [ ] Logs muestran creación de venta exitosa
- [ ] Venta aparece en Firebase Console > Firestore > sales
- [ ] Venta aparece en la interfaz (`/waiter` o `/analytics`)

---

## 📊 Verificar Ventas en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Firestore Database
4. Busca la colección `sales`
5. Deberías ver las ventas registradas con sus datos completos

---

## 🔄 Actualizar Reglas de Firestore desde el Código

Si necesitas actualizar las reglas de Firestore:

```bash
# Desde tu máquina local
firebase deploy --only firestore:rules

# O si no tienes Firebase CLI, copia el contenido de firestore.rules
# y pégalo manualmente en Firebase Console > Firestore > Rules
```

---

## 🆘 Si Aún No Funciona

1. **Revisa los logs:**
   ```bash
   pm2 logs arandano-app --lines 100
   ```

2. **Ejecuta diagnóstico completo:**
   ```bash
   npm run diagnose:firebase
   npm run test:firebase
   ```

3. **Verifica la configuración:**
   ```bash
   cat .env.local
   ls -la firebase-service-account.json
   ```

4. **Prueba conexión directa:**
   ```bash
   node -e "const admin = require('firebase-admin'); const sa = require('./firebase-service-account.json'); admin.initializeApp({credential: admin.credential.cert(sa)}); const db = admin.firestore(); db.collection('sales').add({test: true}).then(() => console.log('OK')).catch(e => console.error('Error:', e));"
   ```

---

## 📝 Notas Importantes

1. **Modo de Base de Datos:**
   - Para producción en OVH, usa `DB_MODE=firebase`
   - No uses `DB_MODE=json` en producción (los datos no persisten)

2. **Permisos de Firestore:**
   - Para desarrollo/pruebas: permite escritura pública
   - Para producción: considera usar autenticación

3. **Backups:**
   - Las ventas se guardan automáticamente en Firebase
   - Realiza backups periódicos: `npm run backup:firebase`

4. **Monitoreo:**
   - Revisa regularmente los logs: `pm2 logs arandano-app`
   - Verifica las ventas en Firebase Console

---

¡Listo! Si todos los puntos del checklist están marcados, las ventas deberían funcionar correctamente en OVH. 🎉
