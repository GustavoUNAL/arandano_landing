# 🚀 Guía de Despliegue en OVH - Arándano Café Bar

Guía completa para desplegar la aplicación en un servidor OVH Cloud.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial del Servidor](#configuración-inicial-del-servidor)
3. [Despliegue de la Aplicación](#despliegue-de-la-aplicación)
4. [Configuración de Nginx](#configuración-de-nginx)
5. [Configuración de SSL/HTTPS](#configuración-de-sslhttps)
6. [Mantenimiento](#mantenimiento)
7. [Solución de Problemas](#solución-de-problemas)

---

## ✅ Requisitos Previos

### En el Servidor OVH

- ✅ Instancia OVH Cloud creada (Ubuntu 20.04+ o Debian 11+)
- ✅ Acceso SSH al servidor
- ✅ Usuario con permisos sudo
- ✅ Puertos abiertos: 22 (SSH), 80 (HTTP), 443 (HTTPS)

### En tu Máquina Local

- ✅ Código fuente del proyecto
- ✅ Archivo `firebase-service-account.json`
- ✅ Variables de entorno configuradas

---

## 🔧 Configuración Inicial del Servidor

### Paso 1: Conectarse al Servidor

```bash
ssh tu-usuario@tu-ip-ovh
```

### Paso 2: Ejecutar Script de Setup

```bash
# Clonar el repositorio o subir los archivos
git clone tu-repositorio.git arandano
cd arandano

# O si ya tienes los archivos, asegúrate de estar en el directorio del proyecto

# Dar permisos de ejecución
chmod +x deploy/ovh/setup-ovh.sh

# Ejecutar setup
bash deploy/ovh/setup-ovh.sh
```

Este script instalará automáticamente:
- ✅ Node.js 20.x (LTS)
- ✅ npm
- ✅ PM2 (gestor de procesos)
- ✅ Nginx
- ✅ Certbot (para SSL)
- ✅ Firewall (UFW) configurado
- ✅ Herramientas útiles

### Paso 3: Configurar Variables de Entorno

```bash
cd ~/arandano

# Crear archivo .env.local
nano .env.local
```

**Contenido mínimo de `.env.local`:**

```env
# Database Mode
DB_MODE=firebase

# Firebase Configuration (cliente)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Firebase Service Account (opción 1: archivo)
# Asegúrate de tener firebase-service-account.json en el directorio raíz

# Firebase Service Account (opción 2: variable de entorno)
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Admin Password
ADMIN_PASSWORD=tu_password_seguro

# Environment
NODE_ENV=production
```

**Subir archivo de credenciales de Firebase:**

```bash
# Desde tu máquina local
scp firebase-service-account.json tu-usuario@tu-ip-ovh:~/arandano/
```

---

## 🚀 Despliegue de la Aplicación

### Opción 1: Script Automático (Recomendado)

```bash
cd ~/arandano

# Dar permisos de ejecución
chmod +x deploy/ovh/deploy.sh

# Ejecutar despliegue
bash deploy/ovh/deploy.sh
```

Este script:
1. ✅ Verifica pre-requisitos
2. ✅ Configura variables de entorno
3. ✅ Instala dependencias
4. ✅ Verifica Firebase
5. ✅ Crea build de producción
6. ✅ Inicia la aplicación con PM2
7. ✅ Configura auto-inicio en el arranque

### Opción 2: Manual

```bash
cd ~/arandano

# 1. Instalar dependencias
npm ci

# 2. Verificar Firebase
npm run diagnose:firebase

# 3. Crear build
npm run build

# 4. Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🌐 Configuración de Nginx

### Paso 1: Configurar Nginx

```bash
cd ~/arandano

# Editar el script si necesitas cambiar el dominio
chmod +x deploy/ovh/configure-nginx.sh
bash deploy/ovh/configure-nginx.sh tu-dominio.com
```

Esto creará:
- ✅ Configuración de Nginx como reverse proxy
- ✅ Rate limiting
- ✅ Compresión Gzip
- ✅ Security headers
- ✅ Cache para assets estáticos

### Paso 2: Verificar Nginx

```bash
# Verificar configuración
sudo nginx -t

# Ver estado
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/arandano-app-error.log
```

---

## 🔒 Configuración de SSL/HTTPS

### Paso 1: Obtener Certificado SSL

```bash
cd ~/arandano

# Configurar SSL con Let's Encrypt
chmod +x deploy/ovh/setup-ssl.sh
bash deploy/ovh/setup-ssl.sh tu-dominio.com tu-email@ejemplo.com
```

### Paso 2: Configurar Renovación Automática

Certbot configura automáticamente la renovación, pero puedes verificar:

```bash
# Probar renovación
sudo certbot renew --dry-run

# Ver certificados
sudo certbot certificates
```

---

## 🔄 Mantenimiento

### Actualizar la Aplicación

```bash
cd ~/arandano

# Hacer pull de cambios
git pull origin main

# Re-desplegar
bash deploy/ovh/deploy.sh
```

### Comandos Útiles de PM2

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs arandano-app

# Ver logs en tiempo real
pm2 logs arandano-app --lines 50 --raw

# Reiniciar aplicación
pm2 restart arandano-app

# Monitoreo
pm2 monit

# Información detallada
pm2 info arandano-app

# Limpiar logs
pm2 flush
```

### Comandos Útiles de Nginx

```bash
# Ver estado
sudo systemctl status nginx

# Reiniciar
sudo systemctl restart nginx

# Recargar configuración
sudo systemctl reload nginx

# Ver logs
sudo tail -f /var/log/nginx/arandano-app-access.log
sudo tail -f /var/log/nginx/arandano-app-error.log

# Verificar configuración
sudo nginx -t
```

### Verificar Firebase

```bash
cd ~/arandano

# Diagnóstico completo
npm run diagnose:firebase

# Verificar conexión
npm run test:firebase

# Verificar datos
npm run verify:firebase
```

### Backups

```bash
cd ~/arandano

# Crear backup de Firebase
npm run backup:firebase

# Restaurar desde backup
npm run restore:firebase
```

---

## 🐛 Solución de Problemas

### La aplicación no inicia

```bash
# Ver logs de PM2
pm2 logs arandano-app --lines 100

# Verificar que el puerto no esté ocupado
sudo lsof -i :3000

# Verificar variables de entorno
cat .env.local

# Verificar Firebase
npm run diagnose:firebase
```

### Error de conexión a Firebase

```bash
# Verificar que el archivo existe
ls -la firebase-service-account.json

# Verificar permisos
chmod 600 firebase-service-account.json

# Verificar contenido (sin mostrar datos sensibles)
head -n 5 firebase-service-account.json

# Ejecutar diagnóstico
npm run diagnose:firebase
```

### Nginx no funciona

```bash
# Verificar configuración
sudo nginx -t

# Ver logs de error
sudo tail -f /var/log/nginx/error.log

# Verificar que la app está corriendo
pm2 status
curl http://localhost:3000
```

### Error de memoria

```bash
# Ver uso de memoria
free -h
pm2 monit

# Reiniciar aplicación
pm2 restart arandano-app

# Verificar límite de memoria en ecosystem.config.js
```

### Actualizar Node.js

```bash
# Verificar versión actual
node -v

# Actualizar Node.js usando NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar nueva versión
node -v
npm -v
```

---

## 📊 Monitoreo

### Health Check

La aplicación incluye un endpoint de health check:

```bash
# Verificar desde el servidor
curl http://localhost:3000/api/health

# O desde fuera (si Nginx está configurado)
curl http://tu-dominio.com/health
```

### Recursos del Sistema

```bash
# CPU y Memoria
htop

# Uso de disco
df -h

# Uso de memoria por proceso
pm2 monit
```

---

## 🔐 Seguridad

### Firewall

El script de setup configura automáticamente UFW. Verificar:

```bash
# Ver reglas
sudo ufw status verbose

# Ver logs
sudo tail -f /var/log/ufw.log
```

### Actualizar Sistema

```bash
# Actualizar paquetes
sudo apt update
sudo apt upgrade -y

# Reiniciar si es necesario
sudo reboot
```

---

## 📝 Checklist Final

Antes de considerar el despliegue completo:

- [ ] Node.js 20.x instalado
- [ ] PM2 instalado y configurado
- [ ] Nginx instalado y configurado
- [ ] SSL/HTTPS configurado
- [ ] Variables de entorno configuradas
- [ ] Firebase conectado correctamente
- [ ] Aplicación corriendo con PM2
- [ ] Nginx sirviendo la aplicación
- [ ] DNS configurado correctamente
- [ ] Firewall configurado
- [ ] Backups configurados
- [ ] Monitoreo configurado

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `pm2 logs arandano-app`
2. Ejecuta diagnóstico: `npm run diagnose:firebase`
3. Verifica la configuración de Nginx: `sudo nginx -t`
4. Revisa la sección de [Solución de Problemas](#solución-de-problemas)

---

## 📚 Documentación Adicional

- [Guía de Firebase](../CONFIGURAR_SERVIDOR_FIREBASE.md)
- [Migración de Datos](../MIGRATION_GUIDE.md)
- [Documentación de la API](../../README.md)

