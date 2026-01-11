# 🔧 Solución: Error 500 en /api/sales

## Problema

Error al acceder a `/api/sales`:

```
api/sales:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

## Diagnóstico

Un error 500 significa que hay un problema en el servidor. Necesitas revisar los logs para ver el error específico.

### Paso 1: Ver Logs de PM2

```bash
# Ver logs en tiempo real
pm2 logs arandano-app --lines 100

# O buscar errores específicos
pm2 logs arandano-app | grep -i "error\|500\|sales" | tail -50
```

### Paso 2: Verificar Configuración de Firebase

```bash
cd ~/projects/arandano_landing

# Verificar DB_MODE
cat .env.local | grep DB_MODE

# Debe ser: DB_MODE=firebase

# Verificar que firebase-service-account.json existe
ls -la firebase-service-account.json

# Ejecutar diagnóstico
npm run diagnose:firebase
```

## Soluciones Comunes

### Solución 1: DB_MODE=json en lugar de firebase

**Síntoma:** Error relacionado con Firebase no disponible.

**Solución:**

```bash
cd ~/projects/arandano_landing

# Cambiar DB_MODE a firebase
sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local

# Verificar cambio
cat .env.local | grep DB_MODE

# Reiniciar aplicación
pm2 restart arandano-app

# Ver logs
pm2 logs arandano-app --lines 50
```

### Solución 2: Firebase Service Account No Configurado

**Síntoma:** Error "Firebase no disponible" o "Cannot find module".

**Solución:**

```bash
cd ~/projects/arandano_landing

# Verificar que el archivo existe
ls -la firebase-service-account.json

# Verificar permisos (debe ser 600)
chmod 600 firebase-service-account.json

# Ejecutar diagnóstico
npm run diagnose:firebase

# Si el diagnóstico falla, necesitas subir el archivo desde tu máquina local:
# Desde tu máquina local:
# scp firebase-service-account.json ubuntu@tu-ip-ovh:~/projects/arandano_landing/
```

### Solución 3: Reglas de Firestore

**Síntoma:** Error de permisos en Firebase.

**Solución:**

Las reglas de Firestore no deberían afectar porque el código usa `firebase-admin` (servidor), pero verifica:

1. Ve a Firebase Console > Firestore Database > Rules
2. Asegúrate de que las reglas permiten escritura (al menos para el servidor)
3. Para desarrollo/pruebas, puedes usar:

```javascript
match /sales/{saleId} {
  allow read, write: if true;
}
```

**Nota:** Las reglas de Firestore solo afectan al cliente, NO al servidor con `firebase-admin`.

### Solución 4: Dependencias Faltantes

**Síntoma:** Error "Cannot find module".

**Solución:**

```bash
cd ~/projects/arandano_landing

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Reiniciar aplicación
pm2 restart arandano-app
```

### Solución 5: Error en la Aplicación (Revisar Logs)

**Síntoma:** Error específico en los logs.

**Solución:**

```bash
# Ver logs completos
pm2 logs arandano-app --lines 200

# Buscar errores de Firebase
pm2 logs arandano-app | grep -i firebase

# Buscar errores de sales
pm2 logs arandano-app | grep -i "sales\|venta"

# Ver información de la aplicación
pm2 info arandano-app
```

## Verificación Paso a Paso

### 1. Verificar Estado de la Aplicación

```bash
pm2 status

# Debe mostrar arandano-app como "online"
```

### 2. Verificar Variables de Entorno

```bash
cd ~/projects/arandano_landing

# Ver .env.local
cat .env.local | grep -E "DB_MODE|FIREBASE"

# Debe mostrar:
# DB_MODE=firebase
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# etc.
```

### 3. Verificar Firebase

```bash
# Ejecutar diagnóstico
npm run diagnose:firebase

# Probar conexión
node scripts/test-firebase-connection.js

# Probar registro de venta
node scripts/test-sales-ovh.js
```

### 4. Probar API Directamente

```bash
# Desde el servidor, probar la API localmente
curl http://localhost:3000/api/sales

# Debe devolver un array (vacío si no hay ventas) o un error específico
```

### 5. Verificar Logs en Tiempo Real

```bash
# Abre una terminal y deja corriendo:
pm2 logs arandano-app

# En otra terminal, intenta acceder a la API desde el navegador
# Verás el error específico en los logs
```

## Comandos de Diagnóstico Completo

```bash
cd ~/projects/arandano_landing && \
echo "=== Estado PM2 ===" && \
pm2 status && \
echo "" && \
echo "=== DB_MODE ===" && \
cat .env.local | grep DB_MODE && \
echo "" && \
echo "=== Firebase Service Account ===" && \
ls -la firebase-service-account.json && \
echo "" && \
echo "=== Diagnóstico Firebase ===" && \
npm run diagnose:firebase && \
echo "" && \
echo "=== Últimos Logs ===" && \
pm2 logs arandano-app --lines 50 --nostream
```

## Solución Rápida (Si No Sabes el Error Específico)

```bash
cd ~/projects/arandano_landing

# 1. Verificar y corregir DB_MODE
sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local

# 2. Verificar Firebase
npm run diagnose:firebase

# 3. Reinstalar dependencias si es necesario
# rm -rf node_modules package-lock.json
# npm install

# 4. Reiniciar aplicación
pm2 restart arandano-app

# 5. Ver logs
pm2 logs arandano-app --lines 100
```

## Si Nada Funciona

1. **Revisar logs completos:**
   ```bash
   pm2 logs arandano-app --lines 500 > /tmp/error-logs.txt
   cat /tmp/error-logs.txt
   ```

2. **Verificar que la aplicación está corriendo:**
   ```bash
   pm2 status
   pm2 info arandano-app
   ```

3. **Reiniciar completamente:**
   ```bash
   pm2 delete arandano-app
   cd ~/projects/arandano_landing
   pm2 start ecosystem.config.js
   pm2 save
   pm2 logs arandano-app
   ```

4. **Revisar configuración completa:**
   - `.env.local` existe y tiene las variables correctas
   - `firebase-service-account.json` existe y tiene permisos 600
   - `DB_MODE=firebase` en `.env.local`
   - Dependencias instaladas: `npm list firebase-admin`

---

**El paso más importante es revisar los logs de PM2 para ver el error específico.** El error 500 puede tener muchas causas, pero los logs te dirán exactamente qué está fallando.
