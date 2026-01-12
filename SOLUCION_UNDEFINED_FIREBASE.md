# ✅ Solución: Error "Cannot use undefined as a Firestore value"

## Problema Resuelto

**Error:**
```
Cannot use "undefined" as a Firestore value (found in field "discountType")
```

**Causa:**
Firestore no acepta valores `undefined` en los documentos. Cuando se crea una venta sin descuento, los campos `discountType` y `discountValue` quedan como `undefined`, lo que causa el error.

**Solución Aplicada:**
Se agregó una función helper `removeUndefinedFields()` en `lib/db-sales.ts` que elimina todos los campos `undefined` antes de guardar en Firestore. Esto se aplica tanto a `createSale()` como a `updateSale()`.

## 📋 Pasos para Desplegar la Corrección

### 1. En Local (Preparar)

```bash
# Verificar cambios
git status

# Ver los cambios específicos
git diff lib/db-sales.ts

# Commit y push
git add lib/db-sales.ts
git commit -m "fix: eliminar campos undefined antes de guardar en Firestore"
git push origin main
```

### 2. En Servidor OVH (Desplegar)

```bash
cd ~/projects/arandano_landing && \
echo "=== 1. Actualizando código ===" && \
git pull origin main && \
echo "" && \
echo "=== 2. Deteniendo aplicación ===" && \
pm2 stop arandano-app && \
echo "" && \
echo "=== 3. Limpiando build ===" && \
rm -rf .next && \
echo "" && \
echo "=== 4. Creando nuevo build ===" && \
npm run build && \
echo "" && \
echo "=== 5. Verificando build ===" && \
ls -la .next/standalone/server.js && \
echo "" && \
echo "=== 6. Reiniciando aplicación ===" && \
pm2 start ecosystem.config.js && \
pm2 save && \
echo "" && \
echo "=== 7. Estado ===" && \
pm2 status && \
echo "" && \
echo "=== 8. Logs (esperando 3 segundos) ===" && \
sleep 3 && \
pm2 logs arandano-app --lines 30 --nostream
```

### 3. Verificar que Funciona

```bash
# Probar API directamente
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "test", "productName": "Test", "quantity": 1, "unitPrice": 1000}],
    "total": 1000,
    "subtotal": 1000
  }'

# O desde el navegador, intentar crear una venta sin descuento
```

## 🔍 Cambios Realizados

**Archivo:** `lib/db-sales.ts`

1. **Nueva función helper:**
   ```typescript
   function removeUndefinedFields(obj: any): any {
     const cleaned: any = {}
     for (const key in obj) {
       if (obj[key] !== undefined) {
         cleaned[key] = obj[key]
       }
     }
     return cleaned
   }
   ```

2. **Modificado `createSale()`:**
   - Ahora elimina campos `undefined` antes de usar `.set()` en Firestore

3. **Modificado `updateSale()`:**
   - Ahora elimina campos `undefined` antes de usar `.update()` en Firestore

## ✅ Resultado Esperado

Después de desplegar:
- ✅ Las ventas se pueden crear sin descuento (sin `discountType` o `discountValue`)
- ✅ Las ventas se pueden crear con descuento (con `discountType` y `discountValue`)
- ✅ No más errores "Cannot use undefined as a Firestore value"
- ✅ Las APIs devuelven JSON correctamente (no HTML de error)

## 🆘 Si Aún Hay Problemas

1. **Verificar logs:**
   ```bash
   pm2 logs arandano-app --lines 100
   ```

2. **Verificar que el build se completó:**
   ```bash
   ls -la .next/standalone/server.js
   ```

3. **Probar API directamente:**
   ```bash
   curl http://localhost:3000/api/sales
   ```

---

**El error específico debería estar resuelto ahora.** 🎉
