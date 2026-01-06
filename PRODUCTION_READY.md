# ✅ Listo para Producción en EC2

## 🎯 Estado Actual

### ✅ Completado
- [x] Build compilado sin errores
- [x] Firebase configurado y datos migrados (166 documentos)
- [x] Variables de entorno configuradas
- [x] Scripts de backup y migración creados
- [x] Scripts de verificación creados
- [x] Configuración optimizada para producción
- [x] Documentación completa de despliegue

### 📊 Resumen de Datos
- **Products**: 39 items
- **Inventory**: 120 items  
- **Sales**: 0 items
- **Expenses**: 1 item
- **Tasks**: 6 items
- **Total**: 166 documentos en Firebase

## 🚀 Despliegue en EC2

### Opción 1: Script Automático (Recomendado)

```bash
# En el servidor EC2
cd ~/ARANDANO
bash deploy-production.sh
```

### Opción 2: Manual

Sigue la guía completa en: **EC2_PRODUCTION_SETUP.md**

## 📋 Checklist Rápido

### Antes de Desplegar
```bash
# En tu máquina local
npm run pre-deploy  # Verificar que todo esté listo
npm run build       # Verificar build
```

### En el Servidor EC2
1. ✅ Node.js 18.x instalado
2. ✅ PM2 instalado
3. ✅ Nginx instalado
4. ✅ Proyecto subido
5. ✅ `.env.local` configurado con Firebase
6. ✅ `firebase-service-account.json` presente
7. ✅ Build creado: `npm run build`
8. ✅ Aplicación iniciada con PM2
9. ✅ Nginx configurado como proxy

## 🔧 Variables de Entorno en Producción

Asegúrate de tener en `.env.local` en el servidor:

```env
# Firebase (ya configurado)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD-ve9dIks9sc3o9hqtIUmXKAC-lPtSvoc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=arandanocafe.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=arandanocafe
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=arandanocafe.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=899760377796
NEXT_PUBLIC_FIREBASE_APP_ID=1:899760377796:web:30be09c98759c6e8591e91

# IMPORTANTE: Cambiar a 'firebase' en producción
DB_MODE=firebase

# Cambiar por una contraseña segura
ADMIN_PASSWORD=tu_password_seguro
```

## 📦 Archivos a Subir a EC2

1. Todo el proyecto (excepto `node_modules` y `.next`)
2. `.env.local` (con las variables de Firebase)
3. `firebase-service-account.json`

## 🔄 Proceso de Despliegue

```bash
# 1. Conectarse a EC2
ssh -i tu-clave.pem ubuntu@tu-ip-ec2

# 2. Ir al proyecto
cd ~/ARANDANO

# 3. Actualizar código (si usas Git)
git pull origin main

# 4. Instalar y build
npm install
npm run build

# 5. Reiniciar aplicación
pm2 restart arandano-app

# 6. Verificar
pm2 status
pm2 logs arandano-app
```

## 🛡️ Seguridad

- ✅ `.env.local` en `.gitignore`
- ✅ `firebase-service-account.json` en `.gitignore`
- ✅ Build optimizado con `output: 'standalone'`
- ✅ Console logs removidos en producción
- ✅ Compresión Gzip habilitada

## 📈 Optimizaciones Aplicadas

- ✅ SWC minification activada
- ✅ Console logs removidos en producción
- ✅ Imágenes optimizadas (AVIF, WebP)
- ✅ Build standalone para servidores
- ✅ Compresión Gzip
- ✅ Headers de seguridad

## 🔍 Verificación Post-Despliegue

```bash
# Verificar que la app está corriendo
pm2 status

# Ver logs
pm2 logs arandano-app

# Probar endpoint
curl http://localhost:3000

# Verificar Firebase
npm run verify:firebase
```

## 📚 Documentación

- **EC2_PRODUCTION_SETUP.md** - Guía completa de despliegue
- **FIREBASE_SETUP.md** - Configuración de Firebase
- **HOW_TO_VERIFY_DATA.md** - Cómo verificar datos en Firebase
- **MIGRATION_GUIDE.md** - Guía de migración a base de datos

## 🚨 Troubleshooting

### Build falla
```bash
npm run pre-deploy  # Verificar problemas
npm run build       # Ver errores específicos
```

### App no inicia
```bash
pm2 logs arandano-app  # Ver errores
# Verificar .env.local y firebase-service-account.json
```

### Firebase no conecta
```bash
npm run test:firebase  # Probar conexión
npm run verify:firebase  # Verificar datos
```

## ✅ Todo Listo

El proyecto está **100% listo** para producción en EC2. Todos los datos están en Firebase y no se perderán en los despliegues.

