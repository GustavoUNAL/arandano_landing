# 🚀 Despliegue Automático - Guía Completa

## 📋 Configuración Inicial (Solo una vez)

### Paso 1: Configurar Git Hook (Opcional - Automático)

El hook `post-merge` se ejecuta automáticamente después de `git pull`.

```bash
# En el servidor
cd ~/projects/arandano_landing

# Crear hook si no existe
if [ ! -f .git/hooks/post-merge ]; then
  cat > .git/hooks/post-merge << 'EOF'
#!/bin/bash
if [ -f deploy.sh ]; then
  bash deploy.sh
fi
EOF
  chmod +x .git/hooks/post-merge
fi
```

### Paso 2: Configurar Variables de Entorno

```bash
# En el servidor
cd ~/projects/arandano_landing

# Crear .env.local si no existe
if [ ! -f .env.local ]; then
  touch .env.local
fi

# Agregar DB_MODE
echo "DB_MODE=firebase" >> .env.local

# Verificar que firebase-service-account.json existe
ls -la firebase-service-account.json
```

### Paso 3: Configurar PM2 (Si no está configurado)

```bash
# En el servidor
cd ~/projects/arandano_landing

# Iniciar con PM2
pm2 start npm --name "arandano-app" -- start --update-env
pm2 save

# Configurar para iniciar al arrancar el servidor
pm2 startup
# Ejecuta el comando que te muestre (algo como: sudo env PATH=...)
```

## 🎯 Despliegue Normal (Después de git pull)

### Opción 1: Automático (Si está configurado el hook)

```bash
# En el servidor
cd ~/projects/arandano_landing
git pull

# El script deploy.sh se ejecuta automáticamente
```

### Opción 2: Manual (Recomendado para más control)

```bash
# En el servidor
cd ~/projects/arandano_landing
git pull
bash deploy.sh

# O usando npm script
npm run deploy
```

### Opción 3: Solo actualizar código (Sin rebuild)

```bash
# En el servidor
cd ~/projects/arandano_landing
git pull
pm2 restart arandano-app --update-env
```

## 📝 Qué Hace el Script `deploy.sh`

1. ✅ **Configura variables de entorno**
   - Verifica/crea `.env.local`
   - Configura `DB_MODE=firebase`
   - Configura `FIREBASE_SERVICE_ACCOUNT` si es posible

2. ✅ **Instala dependencias**
   - Ejecuta `npm ci` o `npm install`

3. ✅ **Verifica Firebase**
   - Ejecuta `npm run diagnose:firebase`

4. ✅ **Crea build**
   - Ejecuta `npm run build`

5. ✅ **Reinicia PM2**
   - Reinicia la aplicación con variables actualizadas

6. ✅ **Verifica que funciona**
   - Verifica que la app está online

## 🔧 Comandos Útiles

### Ver logs
```bash
pm2 logs arandano-app --lines 100
```

### Ver estado
```bash
pm2 status
```

### Reiniciar manualmente
```bash
pm2 restart arandano-app --update-env
```

### Verificar configuración Firebase
```bash
npm run diagnose:firebase
```

### Probar APIs
```bash
curl http://localhost:3000/api/products
```

## 🚨 Troubleshooting

### Error: "DB_MODE no configurado"

**Solución:**
```bash
echo "DB_MODE=firebase" >> .env.local
pm2 restart arandano-app --update-env
```

### Error: "Firebase Service Account no encontrado"

**Solución:**
```bash
# Verificar que el archivo existe
ls -la firebase-service-account.json

# Configurar manualmente
bash scripts/setup-firebase-env.sh
pm2 restart arandano-app --update-env
```

### Error: "Build falla"

**Solución:**
```bash
# Limpiar build anterior
rm -rf .next

# Reinstalar dependencias
npm ci

# Reintentar build
npm run build
```

### Error: "Aplicación no inicia"

**Solución:**
```bash
# Ver logs de error
pm2 logs arandano-app --err --lines 50

# Verificar variables de entorno
cat .env.local

# Reiniciar
pm2 delete arandano-app
pm2 start npm --name "arandano-app" -- start --update-env
```

## 📋 Checklist de Despliegue

- [ ] `git pull` ejecutado
- [ ] `.env.local` existe y tiene `DB_MODE=firebase`
- [ ] `firebase-service-account.json` existe
- [ ] Dependencias instaladas (`npm ci`)
- [ ] Build completado (`npm run build`)
- [ ] PM2 reiniciado con `--update-env`
- [ ] Aplicación está online (`pm2 status`)
- [ ] Logs muestran: `[DB] Firebase conectado a proyecto: arandanocafe`
- [ ] APIs funcionan: `curl http://localhost:3000/api/products`

## 💡 Flujo Recomendado

### En Desarrollo Local:
1. Hacer cambios
2. Commit: `git commit -m "feat: nueva funcionalidad"`
3. Push: `git push`

### En Servidor:
1. Pull: `git pull`
2. Deploy: `bash deploy.sh` (o automático si hay hook)
3. Verificar: `pm2 logs arandano-app --lines 20`

## 🎯 Resumen de Comandos Rápidos

```bash
# Despliegue completo
git pull && bash deploy.sh

# Solo reiniciar (sin rebuild)
git pull && pm2 restart arandano-app --update-env

# Ver logs
pm2 logs arandano-app

# Verificar estado
pm2 status

# Diagnóstico
npm run diagnose:firebase
```

