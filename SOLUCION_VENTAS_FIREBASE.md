# 🔧 Solución: Ventas No Se Guardan en Firebase

## Problema

Las ventas se están guardando en JSON local (`data/sales.json`) en lugar de Firebase.

## Diagnóstico

El sistema verifica `DB_MODE` para decidir si usar Firebase o JSON:
- Si `DB_MODE=json` → Guarda en `data/sales.json`
- Si `DB_MODE=firebase` → Guarda en Firebase Firestore

## Solución

### Paso 1: Verificar DB_MODE en el Servidor

En el servidor OVH, ejecuta:

```bash
cd ~/projects/arandano_landing

# Verificar DB_MODE actual
cat .env.local | grep DB_MODE

# Si muestra DB_MODE=json, cambiarlo a firebase
sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local

# Verificar cambio
cat .env.local | grep DB_MODE
# Debe mostrar: DB_MODE=firebase
```

### Paso 2: Verificar Firebase Está Configurado

```bash
# Verificar que firebase-service-account.json existe
ls -la firebase-service-account.json

# Verificar permisos
chmod 600 firebase-service-account.json

# Ejecutar diagnóstico
npm run diagnose:firebase
```

### Paso 3: Verificar Ventas en Firebase

```bash
# Ejecutar script de verificación
node scripts/verificar-ventas-firebase.js
```

### Paso 4: Reiniciar Aplicación

```bash
# Reiniciar aplicación para que cargue la nueva configuración
pm2 restart arandano-app

# Ver logs
pm2 logs arandano-app --lines 50
```

## Migrar Ventas Existentes de JSON a Firebase

Si ya tienes ventas en JSON y quieres migrarlas a Firebase:

```bash
# Verificar que hay ventas en JSON
cat data/sales.json | jq 'length'

# Si hay ventas, usar el script de migración
npm run migrate:firebase
```

O crear un script específico:

```bash
node scripts/migrate-sales-to-firebase.js
```

## Verificación

### 1. Probar Crear una Venta

Desde la aplicación o con cURL:

```bash
# Crear venta de prueba
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
    "channel": "test",
    "paymentMethod": "efectivo"
  }'
```

### 2. Verificar en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Firestore Database
4. Busca la colección `sales`
5. Deberías ver la nueva venta

### 3. Verificar con Script

```bash
node scripts/verificar-ventas-firebase.js
```

## Comandos Completos (Copy & Paste)

```bash
cd ~/projects/arandano_landing && \
echo "=== Verificando DB_MODE ===" && \
cat .env.local | grep DB_MODE && \
echo "" && \
echo "=== Cambiando a firebase ===" && \
sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local && \
cat .env.local | grep DB_MODE && \
echo "" && \
echo "=== Verificando Firebase ===" && \
npm run diagnose:firebase && \
echo "" && \
echo "=== Reiniciando aplicación ===" && \
pm2 restart arandano-app && \
pm2 logs arandano-app --lines 30
```

## Importante

1. **DB_MODE=firebase** es necesario para que las ventas se guarden en Firebase
2. **DB_MODE=json** guarda en archivos locales (NO persistente en producción)
3. Después de cambiar DB_MODE, **reinicia la aplicación** con `pm2 restart arandano-app`
4. Las nuevas ventas se guardarán en Firebase automáticamente

## Si Aún No Funciona

1. **Verificar logs de PM2:**
   ```bash
   pm2 logs arandano-app | grep -i "sales\|venta\|firebase" | tail -50
   ```

2. **Verificar que DB_MODE se está leyendo correctamente:**
   ```bash
   # Ver logs de inicio
   pm2 logs arandano-app | grep -i "db_mode\|firebase"
   ```

3. **Verificar Firebase directamente:**
   ```bash
   node scripts/test-sales-ovh.js
   ```

4. **Revisar configuración completa:**
   ```bash
   cat .env.local
   ls -la firebase-service-account.json
   npm list firebase-admin
   ```

---

¡Después de seguir estos pasos, todas las ventas se guardarán en Firebase! 🎉
