# 🚀 Iniciar Aplicación en Servidor OVH

## ✅ Estado Actual

- ✅ Las 2 ventas se migraron exitosamente a Firebase
- ✅ DB_MODE=firebase está configurado
- ✅ Firebase está funcionando correctamente
- ❌ El proceso PM2 no existe (necesita iniciarse)

## 🔧 Pasos para Iniciar la Aplicación

Ejecuta estos comandos en el servidor OVH:

```bash
cd ~/projects/arandano_landing && \
echo "=== 1. Verificando build ===" && \
ls -la .next/standalone/server.js 2>/dev/null && \
echo "✅ Build existe" || (echo "❌ Build no existe, creando..." && npm run build) && \
echo "" && \
echo "=== 2. Verificando DB_MODE ===" && \
cat .env.local | grep DB_MODE && \
echo "" && \
echo "=== 3. Verificando Firebase ===" && \
ls -la firebase-service-account.json && \
echo "" && \
echo "=== 4. Creando directorio de logs si no existe ===" && \
mkdir -p logs && \
echo "" && \
echo "=== 5. Iniciando aplicación con PM2 ===" && \
pm2 start ecosystem.config.js && \
pm2 save && \
echo "" && \
echo "=== 6. Verificando estado ===" && \
pm2 status && \
echo "" && \
echo "=== 7. Verificando logs (últimos 30) ===" && \
pm2 logs arandano-app --lines 30 --nostream && \
echo "" && \
echo "=== 8. Verificando API ===" && \
sleep 2 && \
curl -s http://localhost:3000/api/sales | jq 'length' && \
echo "ventas encontradas en API"
```

## 📋 Pasos Manuales (Si Prefieres)

```bash
cd ~/projects/arandano_landing

# 1. Verificar que el build existe
ls -la .next/standalone/server.js

# Si no existe, crear build:
npm run build

# 2. Crear directorio de logs si no existe
mkdir -p logs

# 3. Verificar configuración
cat .env.local | grep DB_MODE
# Debe mostrar: DB_MODE=firebase

# 4. Iniciar aplicación con PM2
pm2 start ecosystem.config.js

# 5. Guardar configuración PM2
pm2 save

# 6. Verificar estado
pm2 status
# Debe mostrar arandano-app como "online"

# 7. Ver logs
pm2 logs arandano-app --lines 50

# 8. Probar API
curl http://localhost:3000/api/sales
# Debe devolver un array con las 2 ventas migradas
```

## ✅ Verificación Final

Después de iniciar PM2:

### 1. Verificar Estado de PM2

```bash
pm2 status
```

Debe mostrar:
```
┌─────┬──────────────┬─────────┬─────────┬──────────┐
│ id  │ name         │ status  │ cpu     │ memory   │
├─────┼──────────────┼─────────┼─────────┼──────────┤
│ 0   │ arandano-app │ online  │ 0%      │ 50 MB    │
└─────┴──────────────┴─────────┴─────────┴──────────┘
```

### 2. Verificar API de Ventas

```bash
# Probar API localmente
curl http://localhost:3000/api/sales

# Debe devolver un JSON con las 2 ventas migradas
```

### 3. Verificar en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (arandanocafe)
3. Ve a Firestore Database
4. Busca la colección `sales`
5. Deberías ver las 2 ventas migradas

### 4. Verificar Logs

```bash
# Ver logs en tiempo real
pm2 logs arandano-app

# O ver últimas 50 líneas
pm2 logs arandano-app --lines 50 --nostream
```

## 🆘 Si Algo Falla

### Error: "Build no existe"

```bash
# Crear build
npm run build

# Verificar que se creó
ls -la .next/standalone/server.js

# Iniciar PM2
pm2 start ecosystem.config.js
```

### Error: "Cannot find module"

```bash
# Reinstalar dependencias
npm install

# Crear build de nuevo
npm run build

# Iniciar PM2
pm2 start ecosystem.config.js
```

### Error: "Port 3000 already in use"

```bash
# Ver qué proceso está usando el puerto
sudo lsof -i :3000

# Detener proceso si es necesario
pm2 delete arandano-app
# O
kill -9 PID

# Iniciar PM2 de nuevo
pm2 start ecosystem.config.js
```

### Error: "Firebase no disponible"

```bash
# Verificar Firebase
npm run diagnose:firebase

# Verificar archivo
ls -la firebase-service-account.json
chmod 600 firebase-service-account.json

# Verificar DB_MODE
cat .env.local | grep DB_MODE
```

### PM2 No Inicia

```bash
# Ver logs de PM2
pm2 logs arandano-app --lines 100

# Ver información detallada
pm2 info arandano-app

# Eliminar proceso y reiniciar
pm2 delete arandano-app
pm2 start ecosystem.config.js
pm2 save
pm2 logs arandano-app
```

---

## 📊 Resumen

Después de ejecutar los comandos:

1. ✅ Las 2 ventas están en Firebase ✅
2. ✅ DB_MODE=firebase está configurado ✅
3. ✅ Firebase funciona correctamente ✅
4. ✅ Aplicación corriendo con PM2 ✅
5. ✅ API funciona y retorna las ventas ✅

**Nuevas ventas se guardarán automáticamente en Firebase** porque DB_MODE=firebase está configurado.

---

¡Listo! Ejecuta los comandos en el servidor y todo debería funcionar correctamente. 🎉
