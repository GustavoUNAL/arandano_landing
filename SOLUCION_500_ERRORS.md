# 🔧 Solución para Errores 500 en APIs

## 🔍 Problema

Las APIs están devolviendo errores 500:
- `GET /api/products` → 500
- `GET /api/tasks` → 500  
- `GET /api/sales` → 500
- `GET /api/inventory` → 500

Pero el diagnóstico muestra que Firebase está configurado correctamente y tiene datos.

## ✅ Cambios Aplicados

### 1. Mejor Manejo de Errores en API Routes

**Archivos actualizados:**
- `app/api/products/route.ts`
- `app/api/tasks/route.ts`
- `app/api/sales/route.ts`
- `app/api/inventory/route.ts`

**Cambios:**
- ✅ Agregado logging detallado de errores: `console.error('[API] Error...')`
- ✅ Mensajes de error más descriptivos
- ✅ Detalles del error incluidos en desarrollo

### 2. Script de Prueba

**Nuevo archivo:** `scripts/test-api-functions.js`
**Comando:** `npm run test:api`

Este script prueba directamente las funciones de DB para identificar errores específicos.

## 🔍 Diagnóstico en el Servidor

### Paso 1: Verificar Logs de la Aplicación

```bash
# Si usas PM2
pm2 logs --lines 100

# Buscar errores específicos
pm2 logs | grep "\[API\] Error"
pm2 logs | grep "\[DB\]"

# Si usas systemd
sudo journalctl -u nextjs-app -f
```

### Paso 2: Probar Funciones Directamente

```bash
# En el servidor
cd ~/projects/arandano_landing
npm run test:api
```

Esto te mostrará exactamente qué función está fallando y por qué.

### Paso 3: Verificar Variables de Entorno

```bash
# Verificar que DB_MODE está en el entorno de la aplicación
cat .env.local | grep DB_MODE

# Verificar que se está cargando en runtime
node -e "require('dotenv').config({path:'.env.local'}); console.log('DB_MODE:', process.env.DB_MODE)"
```

## 🚨 Posibles Causas

### 1. Firebase Admin no se inicializa en API Routes

**Síntoma:** Errores como `[DB] Firebase no disponible pero DB_MODE es firebase`

**Solución:**
- Verificar que `firebase-service-account.json` existe en el servidor
- Verificar permisos del archivo: `chmod 600 firebase-service-account.json`
- Verificar que el archivo sea válido JSON

### 2. Variables de Entorno no se Cargan

**Síntoma:** `DB_MODE` está como `undefined` o `'json'`

**Solución:**
- Asegurarse de que `.env.local` existe en el servidor
- Verificar que PM2 está cargando las variables: `pm2 restart all --update-env`
- O configurar variable del sistema: `export DB_MODE=firebase`

### 3. Error en Inicialización de Firebase

**Síntoma:** Error silencioso durante inicialización

**Solución:**
- Verificar logs al iniciar la aplicación
- Debe mostrar: `[DB] Firebase conectado a proyecto: arandanocafe`
- Si no aparece, Firebase no se está inicializando

## 🔧 Pasos para Solucionar

### 1. Reiniciar con Variables Actualizadas

```bash
# En el servidor
pm2 restart all --update-env

# O si usas systemd
sudo systemctl restart nextjs-app
```

### 2. Verificar Logs al Iniciar

```bash
pm2 logs | head -50
# Debe mostrar: [DB] Firebase conectado a proyecto: arandanocafe
```

### 3. Probar Funciones Directamente

```bash
npm run test:api
```

### 4. Revisar Logs de Errores

```bash
pm2 logs | grep -i error
```

## 📋 Checklist

- [ ] `.env.local` existe y tiene `DB_MODE=firebase`
- [ ] `firebase-service-account.json` existe y es válido
- [ ] La aplicación se reinició después de cambios: `pm2 restart all --update-env`
- [ ] Los logs muestran: `[DB] Firebase conectado a proyecto: arandanocafe`
- [ ] `npm run test:api` muestra qué función está fallando

## 💡 Próximos Pasos

Después de aplicar estos cambios:

1. **Hacer commit:**
```bash
git add app/api scripts/
git commit -m "fix: Mejorar manejo de errores en APIs y agregar logging detallado"
git push
```

2. **En el servidor:**
```bash
git pull
npm run build
pm2 restart all --update-env
pm2 logs | grep "\[API\]\|\[DB\]"
```

3. **Verificar que los errores se muestran correctamente en los logs**

