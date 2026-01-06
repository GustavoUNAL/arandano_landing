# ✅ Checklist de Despliegue en EC2

## 📋 Verificación Pre-Push

### ✅ Estado del Proyecto
- [x] `package.json` actualizado con Firebase 10.14.1 y firebase-admin 12.7.0
- [x] Scripts de despliegue creados
- [x] Documentación completa
- [x] `.gitignore` configurado correctamente
- [x] Estructura del proyecto completa

### ⚠️ Archivos que NO deben subirse a Git
- [x] `.env.local` - Variables de entorno (debe estar en `.gitignore`)
- [x] `firebase-service-account.json` - Credenciales (debe estar en `.gitignore`)
- [x] `node_modules/` - Dependencias (debe estar en `.gitignore`)
- [x] `.next/` - Build (debe estar en `.gitignore`)

## 🚀 Pasos para Desplegar

### 1. En tu Máquina Local

```bash
# 1. Verificar estado
git status

# 2. Agregar cambios si hay
git add .

# 3. Hacer commit
git commit -m "Preparar para despliegue en EC2"

# 4. Integrar cambios remotos si los hay
git pull origin main --rebase

# 5. Hacer push
git push origin main
```

### 2. En el Servidor EC2

```bash
# 1. Ir al proyecto
cd ~/projects/arandano_landing

# 2. Actualizar código
git pull origin main

# 3. Verificar que .env.local existe
ls -la .env.local

# 4. Verificar que firebase-service-account.json existe
ls -la firebase-service-account.json

# 5. Instalar/actualizar dependencias
npm install

# 6. Resolver vulnerabilidades (si las hay)
npm audit fix

# 7. Crear build
npm run build

# 8. Reiniciar aplicación
pm2 restart arandano-app

# 9. Verificar que funciona
pm2 status
pm2 logs arandano-app --lines 20
```

## 📦 Archivos a Subir Manualmente al Servidor

Estos archivos NO deben estar en Git, subirlos manualmente:

```bash
# Desde tu máquina local
scp -i tu-clave.pem .env.local ubuntu@tu-ip-ec2:~/projects/arandano_landing/
scp -i tu-clave.pem firebase-service-account.json ubuntu@tu-ip-ec2:~/projects/arandano_landing/
```

## ✅ Verificación Post-Despliegue

```bash
# En el servidor EC2
# 1. Verificar que la app está corriendo
pm2 status

# 2. Ver logs
pm2 logs arandano-app

# 3. Probar endpoint
curl http://localhost:3000

# 4. Verificar Firebase
npm run verify:firebase
```

## 🔧 Si Hay Problemas

### Build falla
```bash
npm run build
# Revisar errores y corregir
```

### App no inicia
```bash
pm2 logs arandano-app
# Revisar errores en los logs
```

### Firebase no conecta
```bash
npm run test:firebase
# Verificar credenciales en .env.local
```

## 📚 Documentación de Referencia

- `EC2_PRODUCTION_SETUP.md` - Guía completa de despliegue
- `SOLUCION_VULNERABILIDADES.md` - Resolver vulnerabilidades
- `RESOLVER_CONFLICTO_GIT.md` - Resolver conflictos de Git
- `FIX_VULNERABILITIES_EC2.md` - Solución de vulnerabilidades

