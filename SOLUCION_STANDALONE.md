# 🔧 Solución para Errores 500: Firebase Service Account no encontrado

## 🔍 Problema Identificado

Los logs muestran:
```
Error: Firebase Service Account no encontrado. Configura FIREBASE_SERVICE_ACCOUNT o el archivo firebase-service-account.json
```

Y también:
```
⚠ "next start" does not work with "output: standalone" configuration. Use "node .next/standalone/server.js" instead.
```

## 🎯 Causas

1. **Next.js está configurado con `output: 'standalone'`** pero se está usando `next start`
2. **El archivo `firebase-service-account.json` no está disponible** cuando Next.js ejecuta desde el build standalone
3. **El archivo no se busca en las ubicaciones correctas** en modo standalone

## ✅ Soluciones Aplicadas

### 1. Mejora en Búsqueda de Service Account (`lib/firebase-admin.ts`)

**Cambios:**
- ✅ Ahora busca el archivo en múltiples ubicaciones posibles:
  - Raíz del proyecto
  - Un nivel arriba (para builds standalone)
  - Dos niveles arriba
  - Relativo a `lib/`
- ✅ Logs cuando encuentra el archivo
- ✅ Manejo mejorado de errores

### 2. Opciones de Solución

#### Opción A: Usar Servidor Standalone (Recomendado)

**Cambiar el comando de PM2:**

```bash
# En el servidor
pm2 delete arandano-app

# Usar el servidor standalone directamente
pm2 start node --name "arandano-app" -- .next/standalone/server.js

# O si el build está en otro lugar
pm2 start node --name "arandano-app" -- .next/server.js

# Guardar
pm2 save
```

#### Opción B: Usar Variable de Entorno (Más Seguro)

**En el servidor, configurar variable de entorno:**

```bash
# Leer el archivo y convertirlo a variable de entorno
cd ~/projects/arandano_landing

# Obtener el contenido como string en una línea
cat firebase-service-account.json | jq -c | sed 's/"/\\"/g' > /tmp/firebase-sa.txt

# Agregar a .env.local
echo 'FIREBASE_SERVICE_ACCOUNT='$(cat /tmp/firebase-sa.txt) >> .env.local

# Reiniciar con variables actualizadas
pm2 restart all --update-env
```

#### Opción C: Desactivar Standalone (Más Simple)

**Cambiar `next.config.js`:**

```javascript
// Cambiar esta línea:
output: 'standalone',

// Por:
// output: 'standalone', // Comentado temporalmente
```

Luego reconstruir:
```bash
npm run build
pm2 restart all
```

## 🚀 Solución Recomendada (Opción B + Verificar Archivo)

### Paso 1: Verificar que el Archivo Existe

```bash
# En el servidor
cd ~/projects/arandano_landing
ls -la firebase-service-account.json

# Debe mostrar el archivo con permisos 600
chmod 600 firebase-service-account.json
```

### Paso 2: Verificar Ubicación del Archivo

El archivo debe estar en la raíz del proyecto:
```
~/projects/arandano_landing/firebase-service-account.json
```

### Paso 3: Actualizar PM2 con Variables Correctas

```bash
# Verificar que DB_MODE está configurado
cat .env.local | grep DB_MODE

# Si no está, agregarlo
echo "DB_MODE=firebase" >> .env.local

# Reiniciar PM2 cargando .env.local
pm2 restart all --update-env

# O reiniciar específicamente cargando el archivo
pm2 delete arandano-app
pm2 start npm --name "arandano-app" -- start --env-file .env.local
pm2 save
```

### Paso 4: Verificar Logs

```bash
# Ver logs al iniciar
pm2 logs arandano-app --lines 50

# Debe mostrar:
# [DB] Firebase Service Account encontrado en: /path/to/file
# [DB] Firebase conectado a proyecto: arandanocafe
```

## 🔧 Si Sigue Fallando

### Usar Script de Inicio con Variables

**Crear `start-server.sh`:**

```bash
#!/bin/bash
cd ~/projects/arandano_landing
export $(cat .env.local | xargs)
node .next/standalone/server.js
```

**O actualizar PM2 para usar el script:**

```bash
pm2 start start-server.sh --name "arandano-app" --interpreter bash
```

### Verificar Ruta de Archivo en Runtime

El script mejorado ahora busca en múltiples ubicaciones. Si aún no lo encuentra:

1. **Verificar permisos:**
   ```bash
   chmod 600 firebase-service-account.json
   ```

2. **Verificar que está en el directorio correcto:**
   ```bash
   cd ~/projects/arandano_landing
   pwd  # Debe ser /home/ubuntu/projects/arandano_landing
   ls -la firebase-service-account.json
   ```

3. **Probar manualmente:**
   ```bash
   node -e "const fs=require('fs'); const path=require('path'); console.log('Existe?', fs.existsSync(path.join(process.cwd(), 'firebase-service-account.json')))"
   ```

## 📋 Checklist Final

- [ ] `firebase-service-account.json` existe en `~/projects/arandano_landing/`
- [ ] Archivo tiene permisos 600: `chmod 600 firebase-service-account.json`
- [ ] `.env.local` tiene `DB_MODE=firebase`
- [ ] PM2 está usando variables de `.env.local`: `pm2 restart all --update-env`
- [ ] Logs muestran: `[DB] Firebase Service Account encontrado en: ...`
- [ ] Logs muestran: `[DB] Firebase conectado a proyecto: arandanocafe`

## 💡 Recomendación Final

**La mejor solución es usar variable de entorno:**

```bash
# En el servidor
cd ~/projects/arandano_landing

# Convertir archivo a variable de entorno
export FIREBASE_SERVICE_ACCOUNT=$(cat firebase-service-account.json | jq -c)

# Agregar a .env.local (toda en una línea)
echo "FIREBASE_SERVICE_ACCOUNT=$FIREBASE_SERVICE_ACCOUNT" >> .env.local

# Reiniciar
pm2 restart all --update-env
```

Esto evita problemas con rutas de archivos en builds standalone.

