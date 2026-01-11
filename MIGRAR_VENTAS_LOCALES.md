# 🔄 Migrar Ventas Locales a Firebase

## Problema

Creaste 2 ventas desde tu máquina local y están guardadas en JSON local (`data/sales.json`), pero necesitan estar en Firebase para que el servidor las vea.

## Solución

### Opción 1: Migrar desde tu Máquina Local (Recomendado)

Desde tu máquina local, ejecuta:

```bash
cd ~/Documents/Projects/ARANDANO

# Verificar que hay ventas en JSON local
cat data/sales.json | jq 'length'

# Migrar ventas a Firebase
node scripts/migrate-sales-to-firebase.js
```

Este script:
- ✅ Lee las ventas de `data/sales.json`
- ✅ Las migra a Firebase Firestore
- ✅ Evita duplicados (verifica si ya existen)

### Opción 2: Subir el archivo y Migrar en el Servidor

Si prefieres hacerlo desde el servidor:

```bash
# 1. Desde tu máquina local, subir sales.json al servidor
scp data/sales.json ubuntu@tu-ip-ovh:~/projects/arandano_landing/data/

# 2. En el servidor, migrar
ssh ubuntu@tu-ip-ovh
cd ~/projects/arandano_landing
node scripts/migrate-sales-to-firebase.js
```

---

## 🔧 Configurar Servidor para que Use Firebase

### Paso 1: Iniciar Aplicación con PM2

El proceso PM2 no existe. Necesitas iniciarlo:

```bash
cd ~/projects/arandano_landing

# Verificar que el build existe
ls -la .next/standalone/server.js

# Si no existe, crear build
npm run build

# Iniciar aplicación con PM2
pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

# Verificar estado
pm2 status

# Ver logs
pm2 logs arandano-app --lines 50
```

### Paso 2: Verificar que Funciona

```bash
# Verificar que la aplicación está corriendo
pm2 status
# Debe mostrar arandano-app como "online"

# Probar API de ventas
curl http://localhost:3000/api/sales

# Debe devolver un array con las ventas (vacío si no hay, o con ventas si migraste)

# Ver logs en tiempo real
pm2 logs arandano-app
```

---

## 📋 Pasos Completos (Copy & Paste)

### En tu Máquina Local

```bash
cd ~/Documents/Projects/ARANDANO

# 1. Verificar ventas locales
cat data/sales.json | jq 'length'

# 2. Ver ventas
cat data/sales.json | jq '.[] | {id, ticketNumber, total, date}'

# 3. Migrar a Firebase
node scripts/migrate-sales-to-firebase.js
```

### En el Servidor OVH

```bash
cd ~/projects/arandano_landing && \
echo "=== 1. Verificando build ===" && \
ls -la .next/standalone/server.js 2>/dev/null || echo "Build no existe, creando..." && \
( [ ! -f .next/standalone/server.js ] && npm run build || true ) && \
echo "" && \
echo "=== 2. Verificando DB_MODE ===" && \
cat .env.local | grep DB_MODE && \
echo "" && \
echo "=== 3. Iniciando aplicación con PM2 ===" && \
pm2 start ecosystem.config.js && \
pm2 save && \
echo "" && \
echo "=== 4. Verificando estado ===" && \
pm2 status && \
echo "" && \
echo "=== 5. Verificando logs (últimos 30) ===" && \
pm2 logs arandano-app --lines 30 --nostream && \
echo "" && \
echo "=== 6. Verificando API ===" && \
curl -s http://localhost:3000/api/sales | jq 'length' && \
echo "ventas encontradas en API"
```

---

## ✅ Verificación Final

1. **En tu máquina local:**
   ```bash
   # Verificar que las ventas se migraron
   node scripts/verificar-ventas-firebase.js
   ```

2. **En Firebase Console:**
   - Ve a Firebase Console > Firestore Database
   - Busca la colección `sales`
   - Deberías ver las 2 ventas migradas

3. **En el servidor:**
   ```bash
   # Verificar que la API funciona
   curl http://localhost:3000/api/sales | jq '.'
   
   # Debe mostrar un array con las ventas
   ```

---

## 🎯 Importante

1. **Las ventas que creaste localmente** están en `data/sales.json` (JSON local)
2. **Para que el servidor las vea**, deben estar en Firebase
3. **Usa el script de migración** para moverlas a Firebase
4. **Después de migrar**, el servidor verá las ventas automáticamente
5. **Nuevas ventas** se guardarán en Firebase automáticamente (porque DB_MODE=firebase)

---

¡Después de migrar las ventas y iniciar PM2, todo debería funcionar correctamente! 🎉
