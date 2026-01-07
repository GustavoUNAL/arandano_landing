# 🔍 Cómo Ver Errores del Servidor

## 📋 Comandos Rápidos

### Ver todos los logs (últimas 100 líneas)
```bash
pm2 logs arandano-app --lines 100
```

### Ver solo errores
```bash
pm2 logs arandano-app --err --lines 100
```

### Ver logs en tiempo real
```bash
pm2 logs arandano-app
```

### Filtrar por palabras clave
```bash
# Ver errores de API
pm2 logs arandano-app | grep "\[API\]"

# Ver errores de DB
pm2 logs arandano-app | grep "\[DB\]"

# Ver errores de Firebase
pm2 logs arandano-app | grep -i "firebase\|error"

# Ver errores al crear ventas
pm2 logs arandano-app | grep -i "sales\|venta"
```

### Ver logs desde archivos
```bash
# Logs de salida (stdout)
tail -f ~/.pm2/logs/arandano-app-out.log

# Logs de error (stderr)
tail -f ~/.pm2/logs/arandano-app-error.log

# Buscar en logs de error
grep -i "error\|firebase" ~/.pm2/logs/arandano-app-error.log | tail -50
```

## 🎯 Para el Error 500 en `/api/sales`

### Paso 1: Ver logs mientras creas una venta

**Terminal 1 (en el servidor):**
```bash
pm2 logs arandano-app | grep -E "\[API\]|\[DB\]|Error|Error creando"
```

**Terminal 2 (en el navegador):**
1. Abre `/waiter`
2. Agrega productos al carrito
3. Intenta crear una venta
4. Ve los errores en Terminal 1

### Paso 2: Ver el error completo

```bash
# Ver el último error completo
pm2 logs arandano-app --err --lines 50 | tail -20

# O buscar el stack trace completo
grep -A 20 "Error creando venta" ~/.pm2/logs/arandano-app-error.log | tail -30
```

## 📊 Ejemplo de Salida Esperada

Si todo está bien, deberías ver:
```
[DB] Firebase Service Account encontrado en: /path/to/file
[DB] Firebase conectado a proyecto: arandanocafe
[API] Creando venta con items: 3
[API] Venta creada exitosamente: sale-xxxxx
[API] Producto prod-xxxxx actualizado
```

Si hay error, verás:
```
[API] Error creando venta: [DB] Firebase no disponible pero DB_MODE es firebase
[API] Stack trace: ...
```

## 🔧 Solución Rápida

Después de ver los logs, según el error:

### Error: "Firebase Service Account no encontrado"
```bash
bash scripts/setup-firebase-env.sh
pm2 restart all --update-env
```

### Error: "Firebase no disponible"
```bash
npm run diagnose:firebase
# Seguir las instrucciones que muestra
```

### Error: "Permission denied" o similar
```bash
# Verificar permisos
ls -la firebase-service-account.json
chmod 600 firebase-service-account.json

# Reiniciar
pm2 restart all
```

