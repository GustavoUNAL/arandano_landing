# 🔍 Debug: Error 500 al Crear Venta

## 🚨 Problema

Al registrar una venta desde `/waiter`, se obtiene:
```
POST /api/sales → 500 (Internal Server Error)
```

## 🔍 Pasos para Diagnosticar

### 1. Ver Logs del Servidor en Tiempo Real

```bash
# En el servidor
pm2 logs arandano-app --lines 100

# O buscar errores específicos
pm2 logs arandano-app | grep -i "\[API\]\|\[DB\]\|Error"
```

### 2. Intentar Crear Venta y Ver Logs

1. Abre la consola del navegador (F12)
2. Intenta crear una venta desde `/waiter`
3. En el servidor, ejecuta: `pm2 logs arandano-app | tail -f`
4. Verás el error exacto en los logs

### 3. Verificar Logs de Errores

```bash
# Ver solo errores
pm2 logs arandano-app --err --lines 100

# O buscar en el archivo de logs
tail -f ~/.pm2/logs/arandano-app-error.log | grep -i "sales\|firebase"
```

## 🔧 Soluciones Comunes

### Problema 1: Firebase no disponible

**Síntoma en logs:**
```
[API] Error creando venta: [DB] Firebase no disponible pero DB_MODE es firebase
```

**Solución:**
```bash
# Verificar configuración
cat .env.local | grep DB_MODE
cat .env.local | grep FIREBASE_SERVICE_ACCOUNT

# Si falta, configurar
bash scripts/setup-firebase-env.sh

# Reiniciar
pm2 restart all --update-env
```

### Problema 2: Error al crear en Firebase

**Síntoma en logs:**
```
[DB] Error creando venta en Firebase: [mensaje de error]
```

**Solución:**
- Verificar conexión: `npm run diagnose:firebase`
- Verificar permisos de Firestore
- Verificar que la colección `sales` existe en Firebase

### Problema 3: Error al actualizar producto

**Síntoma en logs:**
```
[API] Error actualizando producto X
```

**Solución:**
- La venta se crea pero el producto no se actualiza
- Verificar que el producto existe
- Verificar permisos de escritura en Firestore

## 🧪 Probar Creación de Venta Manualmente

### Opción 1: Usar curl

```bash
# En el servidor
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "test-product",
        "productName": "Producto Test",
        "quantity": 1,
        "unitPrice": 1000
      }
    ],
    "total": 1000,
    "channel": "whatsapp",
    "paymentMethod": "efectivo"
  }'
```

### Opción 2: Usar script Node.js

```bash
# Crear script temporal
cat > /tmp/test-sale.js << 'EOF'
require('dotenv').config({ path: '.env.local' })
const { createSale } = require('./lib/db-sales')

async function test() {
  try {
    const sale = await createSale({
      date: new Date().toISOString(),
      hour: new Date().getHours(),
      items: [{
        productId: 'test',
        productName: 'Test',
        quantity: 1,
        unitPrice: 1000,
        totalPrice: 1000
      }],
      total: 1000,
      channel: 'whatsapp'
    })
    console.log('✅ Venta creada:', sale.id)
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

test()
EOF

# Ejecutar
cd ~/projects/arandano_landing
node /tmp/test-sale.js
```

## 📋 Checklist de Verificación

- [ ] `npm run diagnose:firebase` muestra conexión exitosa
- [ ] `npm run test:api` funciona sin errores
- [ ] Los logs muestran: `[DB] Firebase conectado a proyecto: arandanocafe`
- [ ] `.env.local` tiene `DB_MODE=firebase`
- [ ] PM2 se reinició con `--update-env`
- [ ] Firestore tiene permisos de escritura
- [ ] La colección `sales` existe en Firebase Console

## 💡 Siguiente Paso

**En el servidor, ejecuta:**

```bash
# Ver logs en tiempo real mientras intentas crear una venta
pm2 logs arandano-app | grep -E "\[API\]|\[DB\]|Error|Error creando"
```

Esto te mostrará el error exacto que está causando el 500.

