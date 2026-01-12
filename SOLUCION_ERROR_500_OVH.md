# 🔧 Solución: Error 500 en Servidor OVH

## Problema

Las APIs devuelven error 500:
- `GET http://51.222.24.228:3000/api/sales 500`
- `GET http://51.222.24.228:3000/api/products 500`
- `GET http://51.222.24.228:3000/api/inventory 500`

Y el error: `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

Esto significa que el servidor está devolviendo HTML (página de error) en lugar de JSON.

## 🔍 Diagnóstico Inmediato

En el servidor OVH, ejecuta estos comandos para ver el error real:

```bash
cd ~/projects/arandano_landing

# 1. Ver estado de PM2
pm2 status

# 2. Ver logs completos (esto te mostrará el error real)
pm2 logs arandano-app --lines 100

# 3. Buscar errores específicos
pm2 logs arandano-app | grep -i "error\|exception\|firebase" | tail -50

# 4. Probar API directamente desde el servidor
curl http://localhost:3000/api/sales
# Esto te mostrará el error exacto

# 5. Ver información de la aplicación
pm2 info arandano-app
```

## 🔧 Soluciones Comunes

### Solución 1: Error de Firebase (Más Probable)

El error más común es que Firebase no está configurado correctamente:

```bash
cd ~/projects/arandano_landing

# Verificar Firebase
npm run diagnose:firebase

# Verificar que firebase-service-account.json existe
ls -la firebase-service-account.json

# Verificar permisos
chmod 600 firebase-service-account.json

# Verificar DB_MODE
cat .env.local | grep DB_MODE
# Debe ser: DB_MODE=firebase
```

### Solución 2: Rebuild de la Aplicación

El build puede estar corrupto o desactualizado:

```bash
cd ~/projects/arandano_landing

# Detener aplicación
pm2 stop arandano-app
pm2 delete arandano-app

# Limpiar build
rm -rf .next

# Reinstalar dependencias
npm install

# Crear nuevo build
npm run build

# Verificar que el build existe
ls -la .next/standalone/server.js

# Iniciar aplicación
pm2 start ecosystem.config.js
pm2 save

# Ver logs
pm2 logs arandano-app --lines 50
```

### Solución 3: Error en Variables de Entorno

Las variables de entorno pueden no estar cargándose correctamente:

```bash
cd ~/projects/arandano_landing

# Verificar .env.local
cat .env.local

# Verificar que DB_MODE=firebase
grep DB_MODE .env.local

# Verificar que firebase-service-account.json existe
ls -la firebase-service-account.json

# Reiniciar aplicación después de verificar
pm2 restart arandano-app
pm2 logs arandano-app --lines 50
```

### Solución 4: Reinstalar Dependencias

Puede haber dependencias faltantes o corruptas:

```bash
cd ~/projects/arandano_landing

# Detener aplicación
pm2 stop arandano-app

# Limpiar node_modules
rm -rf node_modules package-lock.json

# Reinstalar dependencias
npm install

# Verificar instalación
npm list firebase-admin
npm list @opentelemetry/api

# Rebuild
npm run build

# Reiniciar
pm2 start ecosystem.config.js
pm2 save
pm2 logs arandano-app
```

## 📋 Script Completo de Diagnóstico y Solución

Ejecuta estos comandos en el servidor OVH:

```bash
cd ~/projects/arandano_landing && \
echo "=== 1. Estado PM2 ===" && \
pm2 status && \
echo "" && \
echo "=== 2. DB_MODE ===" && \
cat .env.local | grep DB_MODE && \
echo "" && \
echo "=== 3. Firebase Service Account ===" && \
ls -la firebase-service-account.json && \
echo "" && \
echo "=== 4. Diagnóstico Firebase ===" && \
npm run diagnose:firebase && \
echo "" && \
echo "=== 5. Últimos Logs (50 líneas) ===" && \
pm2 logs arandano-app --lines 50 --nostream && \
echo "" && \
echo "=== 6. Probar API localmente ===" && \
curl -s http://localhost:3000/api/sales | head -20
```

## 🔄 Solución Rápida Completa

Si necesitas hacer un rebuild completo:

```bash
cd ~/projects/arandano_landing && \
echo "=== Deteniendo aplicación ===" && \
pm2 stop arandano-app 2>/dev/null || true && \
pm2 delete arandano-app 2>/dev/null || true && \
echo "" && \
echo "=== Limpiando ===" && \
rm -rf .next node_modules package-lock.json && \
echo "" && \
echo "=== Reinstalando dependencias ===" && \
npm install && \
echo "" && \
echo "=== Verificando Firebase ===" && \
npm run diagnose:firebase && \
echo "" && \
echo "=== Creando build ===" && \
npm run build && \
echo "" && \
echo "=== Verificando build ===" && \
ls -la .next/standalone/server.js && \
echo "" && \
echo "=== Creando directorio logs ===" && \
mkdir -p logs && \
echo "" && \
echo "=== Iniciando aplicación ===" && \
pm2 start ecosystem.config.js && \
pm2 save && \
echo "" && \
echo "=== Estado ===" && \
pm2 status && \
echo "" && \
echo "=== Esperando 3 segundos y probando API ===" && \
sleep 3 && \
curl -s http://localhost:3000/api/sales | jq '.' || curl -s http://localhost:3000/api/sales | head -20
```

## 🆘 Si Nada Funciona

1. **Ver logs completos:**
   ```bash
   pm2 logs arandano-app --lines 500 > /tmp/pm2-logs.txt
   cat /tmp/pm2-logs.txt
   ```

2. **Ver errores de sistema:**
   ```bash
   # Ver logs del sistema
   sudo journalctl -u pm2-ubuntu -n 100
   # O si no existe
   sudo journalctl -xe | tail -50
   ```

3. **Verificar que Node.js funciona:**
   ```bash
   node -v
   npm -v
   ```

4. **Probar directamente:**
   ```bash
   cd ~/projects/arandano_landing/.next/standalone
   node server.js
   # Esto debería mostrar errores en la consola
   ```

5. **Verificar Nginx (si está configurado):**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   sudo tail -f /var/log/nginx/arandano-app-error.log
   ```

## ⚠️ Notas Importantes

1. **Los logs de PM2 son críticos** - Siempre revisa `pm2 logs arandano-app` para ver el error exacto
2. **El build debe existir** - Verifica que `.next/standalone/server.js` existe
3. **Firebase debe estar configurado** - Ejecuta `npm run diagnose:firebase`
4. **DB_MODE=firebase** - Es crítico para que funcione

---

**El paso más importante es revisar los logs de PM2 para ver el error específico que está causando el 500.**
