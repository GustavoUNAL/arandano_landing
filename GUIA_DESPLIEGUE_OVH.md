# 🚀 Guía Completa de Despliegue en OVH

Guía paso a paso para desplegar Arándano Café Bar en un nuevo servidor OVH.

## 📋 Prerrequisitos

### En OVH Cloud

- ✅ Instancia OVH Cloud creada (Ubuntu 20.04+ o Debian 11+)
- ✅ IP pública asignada
- ✅ Acceso SSH al servidor
- ✅ Usuario con permisos sudo configurado
- ✅ Puertos abiertos en el firewall:
  - Puerto 22 (SSH)
  - Puerto 80 (HTTP)
  - Puerto 443 (HTTPS)

### En tu Máquina Local

- ✅ Código del proyecto
- ✅ Archivo `firebase-service-account.json`
- ✅ Variables de Firebase configuradas
- ✅ Acceso SSH al servidor OVH

---

## 🔧 Paso 1: Conectarse al Servidor OVH

```bash
ssh tu-usuario@tu-ip-ovh
```

**Nota:** Si es la primera vez, asegúrate de tener las credenciales correctas.

---

## 📦 Paso 2: Configuración Inicial del Servidor

### Opción A: Script Automático (Recomendado)

```bash
# Crear directorio para el proyecto
mkdir -p ~/projects
cd ~/projects

# Clonar el repositorio (o subir los archivos)
git clone tu-repositorio.git arandano
cd arandano

# Dar permisos de ejecución
chmod +x deploy/ovh/setup-ovh.sh

# Ejecutar setup automático
bash deploy/ovh/setup-ovh.sh
```

Este script instala automáticamente:
- ✅ Node.js 20.x (LTS)
- ✅ npm
- ✅ PM2 (gestor de procesos)
- ✅ Nginx
- ✅ Certbot (para SSL)
- ✅ Firewall (UFW) configurado

### Opción B: Instalación Manual

Si prefieres instalar manualmente:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node -v  # Debe mostrar v20.x.x
npm -v

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Configurar Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## 📁 Paso 3: Subir el Proyecto al Servidor

### Si usas Git (Recomendado)

```bash
cd ~/projects
git clone tu-repositorio.git arandano
cd arandano
```

### Si no usas Git

Desde tu máquina local:

```bash
# Crear tar.gz del proyecto (excluyendo node_modules y .next)
tar -czf arandano.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' ARANDANO

# Subir al servidor
scp arandano.tar.gz tu-usuario@tu-ip-ovh:~/projects/

# En el servidor, extraer
ssh tu-usuario@tu-ip-ovh
cd ~/projects
tar -xzf arandano.tar.gz
mv ARANDANO arandano
cd arandano
```

---

## 🔐 Paso 4: Configurar Variables de Entorno

### 4.1 Crear archivo .env.local

```bash
cd ~/projects/arandano

# Copiar template
cp deploy/ovh/env.example .env.local

# Editar con tus valores
nano .env.local
```

### 4.2 Contenido del .env.local

```env
# Database Mode
DB_MODE=firebase

# Firebase Configuration (Cliente)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Admin Password
ADMIN_PASSWORD=tu_password_seguro

# Environment
NODE_ENV=production
```

**Nota:** Los valores de Firebase los encuentras en:
- Firebase Console > Project Settings > General > Your apps

### 4.3 Subir archivo de credenciales de Firebase

Desde tu máquina local:

```bash
# Subir firebase-service-account.json
scp firebase-service-account.json tu-usuario@tu-ip-ovh:~/projects/arandano/

# En el servidor, dar permisos correctos
ssh tu-usuario@tu-ip-ovh
cd ~/projects/arandano
chmod 600 firebase-service-account.json
```

---

## 🚀 Paso 5: Desplegar la Aplicación

### Opción A: Script Automático Completo (Recomendado)

```bash
cd ~/projects/arandano

# Dar permisos de ejecución
chmod +x deploy/ovh/full-deploy.sh

# Ejecutar despliegue completo
bash deploy/ovh/full-deploy.sh
```

Este script:
1. ✅ Verifica pre-requisitos
2. ✅ Configura variables de entorno
3. ✅ Instala dependencias (`npm ci`)
4. ✅ Verifica Firebase
5. ✅ Crea build de producción
6. ✅ Copia archivos necesarios
7. ✅ Inicia la aplicación con PM2
8. ✅ Configura auto-inicio

### Opción B: Script de Despliegue Simple

```bash
cd ~/projects/arandano
chmod +x deploy/ovh/deploy.sh
bash deploy/ovh/deploy.sh
```

### Opción C: Manual

```bash
cd ~/projects/arandano

# 1. Instalar dependencias
npm ci

# 2. Verificar Firebase (opcional pero recomendado)
npm run diagnose:firebase

# 3. Crear build de producción
npm run build

# 4. Iniciar con PM2
pm2 start ecosystem.config.js

# 5. Guardar configuración PM2
pm2 save

# 6. Configurar auto-inicio
pm2 startup
# Sigue las instrucciones que te da el comando
```

---

## 🌐 Paso 6: Configurar Nginx

### 6.1 Configurar Nginx para tu dominio

```bash
cd ~/projects/arandano

# Dar permisos de ejecución
chmod +x deploy/ovh/configure-nginx.sh

# Ejecutar configuración (reemplaza con tu dominio)
bash deploy/ovh/configure-nginx.sh tu-dominio.com
```

Este script:
- ✅ Crea configuración de Nginx como reverse proxy
- ✅ Configura rate limiting
- ✅ Habilita compresión Gzip
- ✅ Configura security headers
- ✅ Configura cache para assets estáticos

### 6.2 Verificar Nginx

```bash
# Verificar configuración
sudo nginx -t

# Si todo está bien, recargar Nginx
sudo systemctl reload nginx

# Ver estado
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/arandano-app-error.log
```

### 6.3 Configuración Manual de Nginx (si prefieres)

```bash
sudo nano /etc/nginx/sites-available/arandano
```

Contenido:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Habilitar sitio:

```bash
sudo ln -s /etc/nginx/sites-available/arandano /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Paso 7: Configurar SSL/HTTPS (Recomendado)

### 7.1 Obtener Certificado SSL

**Importante:** Antes de esto, asegúrate de que:
- ✅ Tu dominio apunta a la IP del servidor OVH
- ✅ Nginx está configurado correctamente
- ✅ La aplicación está corriendo

```bash
cd ~/projects/arandano

# Dar permisos de ejecución
chmod +x deploy/ovh/setup-ssl.sh

# Ejecutar configuración SSL
bash deploy/ovh/setup-ssl.sh tu-dominio.com tu-email@ejemplo.com
```

O manualmente:

```bash
# Obtener certificado SSL con Certbot
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Seguir las instrucciones
# - Ingresar email
# - Aceptar términos
# - Decidir si compartir email con EFF
```

### 7.2 Verificar Renovación Automática

Certbot configura automáticamente la renovación, pero puedes verificar:

```bash
# Probar renovación (dry-run)
sudo certbot renew --dry-run

# Ver certificados instalados
sudo certbot certificates

# Verificar que el cronjob está configurado
sudo systemctl status certbot.timer
```

---

## ✅ Paso 8: Verificar el Despliegue

### 8.1 Verificar PM2

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs arandano-app --lines 50

# Ver monitoreo
pm2 monit
```

### 8.2 Verificar Aplicación Localmente

```bash
# Desde el servidor
curl http://localhost:3000

# Debe responder con HTML
```

### 8.3 Verificar Nginx

```bash
# Ver estado
sudo systemctl status nginx

# Ver logs de acceso
sudo tail -f /var/log/nginx/arandano-app-access.log

# Ver logs de error
sudo tail -f /var/log/nginx/arandano-app-error.log
```

### 8.4 Verificar desde Navegador

1. Abre tu navegador
2. Visita: `http://tu-dominio.com` (debe redirigir a HTTPS)
3. O directamente: `https://tu-dominio.com`
4. Verifica que la aplicación carga correctamente

---

## 🔄 Paso 9: Comandos Útiles para Mantenimiento

### PM2 - Gestión de la Aplicación

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs arandano-app

# Ver logs con líneas limitadas
pm2 logs arandano-app --lines 100

# Reiniciar aplicación
pm2 restart arandano-app

# Detener aplicación
pm2 stop arandano-app

# Iniciar aplicación
pm2 start arandano-app

# Eliminar de PM2
pm2 delete arandano-app

# Monitoreo en tiempo real
pm2 monit

# Información detallada
pm2 info arandano-app

# Guardar configuración actual
pm2 save

# Ver lista de procesos
pm2 list
```

### Nginx - Gestión del Servidor Web

```bash
# Ver estado
sudo systemctl status nginx

# Reiniciar
sudo systemctl restart nginx

# Recargar configuración (sin downtime)
sudo systemctl reload nginx

# Verificar configuración
sudo nginx -t

# Ver logs de acceso
sudo tail -f /var/log/nginx/arandano-app-access.log

# Ver logs de error
sudo tail -f /var/log/nginx/arandano-app-error.log
```

### Actualizar la Aplicación

```bash
cd ~/projects/arandano

# Si usas Git
git pull origin main

# Si no usas Git, sube los archivos nuevos y luego:

# Re-desplegar (usa el script automático)
bash deploy/ovh/full-deploy.sh

# O manualmente
npm ci
npm run build
pm2 restart arandano-app
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

# Verificar permisos del archivo de credenciales
ls -la firebase-service-account.json
chmod 600 firebase-service-account.json
```

### Error de conexión a Firebase

```bash
# Verificar que el archivo existe
ls -la firebase-service-account.json

# Verificar permisos
chmod 600 firebase-service-account.json

# Ejecutar diagnóstico
npm run diagnose:firebase

# Verificar variables de entorno
cat .env.local | grep FIREBASE
```

### Nginx no funciona

```bash
# Verificar configuración
sudo nginx -t

# Ver logs de error
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/arandano-app-error.log

# Verificar que la app está corriendo
pm2 status
curl http://localhost:3000

# Verificar que el sitio está habilitado
ls -la /etc/nginx/sites-enabled/ | grep arandano
```

### Error de SSL/Certificado

```bash
# Ver certificados
sudo certbot certificates

# Renovar certificado manualmente
sudo certbot renew

# Reinstalar certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com --force-renewal
```

### Error de memoria

```bash
# Ver uso de memoria
free -h

# Ver uso por proceso
pm2 monit

# Verificar límite de memoria en ecosystem.config.js
cat ecosystem.config.js | grep max_memory_restart

# Reiniciar aplicación
pm2 restart arandano-app
```

---

## 📊 Monitoreo

### Health Check

```bash
# Verificar desde el servidor
curl http://localhost:3000/api/health

# O desde fuera (si Nginx está configurado)
curl https://tu-dominio.com/api/health
```

### Recursos del Sistema

```bash
# CPU y Memoria
htop
# O si no está instalado:
top

# Uso de disco
df -h

# Uso de memoria por proceso
pm2 monit

# Ver procesos
ps aux | grep node
```

---

## 🔐 Seguridad

### Firewall

```bash
# Ver estado del firewall
sudo ufw status verbose

# Ver logs del firewall
sudo tail -f /var/log/ufw.log

# Agregar reglas si es necesario
sudo ufw allow puerto/protocolo
```

### Actualizar Sistema

```bash
# Actualizar paquetes
sudo apt update
sudo apt upgrade -y

# Reiniciar si es necesario
sudo reboot
```

### Permisos de Archivos Sensibles

```bash
# Asegurar permisos correctos
chmod 600 ~/projects/arandano/.env.local
chmod 600 ~/projects/arandano/firebase-service-account.json
```

---

## 📝 Checklist Final

Antes de considerar el despliegue completo:

- [ ] Node.js 20.x instalado: `node -v`
- [ ] PM2 instalado y funcionando: `pm2 -v`
- [ ] Nginx instalado y configurado: `nginx -v`
- [ ] SSL/HTTPS configurado y funcionando
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Firebase conectado correctamente: `npm run diagnose:firebase`
- [ ] Aplicación corriendo con PM2: `pm2 status`
- [ ] Nginx sirviendo la aplicación: `sudo systemctl status nginx`
- [ ] DNS configurado correctamente apuntando al servidor
- [ ] Firewall configurado: `sudo ufw status`
- [ ] Certificado SSL válido: `sudo certbot certificates`
- [ ] Aplicación accesible desde navegador
- [ ] APIs funcionando correctamente
- [ ] Sin errores en logs: `pm2 logs arandano-app`

---

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa los logs:**
   ```bash
   pm2 logs arandano-app
   sudo tail -f /var/log/nginx/arandano-app-error.log
   ```

2. **Ejecuta diagnóstico:**
   ```bash
   npm run diagnose:firebase
   ```

3. **Verifica configuración:**
   ```bash
   sudo nginx -t
   pm2 info arandano-app
   ```

4. **Verifica registro de ventas:**
   ```bash
   # Probar registro de ventas
   node scripts/test-sales-ovh.js
   ```

5. **Revisa la documentación:**
   - `deploy/ovh/README.md` - Documentación completa
   - `deploy/ovh/CHECKLIST.md` - Checklist detallado
   - `VERIFICAR_VENTAS_OVH.md` - Guía de verificación de ventas

---

## 📚 Resumen Rápido (TL;DR)

```bash
# 1. Conectarse al servidor
ssh tu-usuario@tu-ip-ovh

# 2. Clonar proyecto
cd ~/projects
git clone tu-repositorio.git arandano
cd arandano

# 3. Setup inicial
chmod +x deploy/ovh/setup-ovh.sh
bash deploy/ovh/setup-ovh.sh

# 4. Configurar variables de entorno
cp deploy/ovh/env.example .env.local
nano .env.local
# Subir firebase-service-account.json desde local

# 5. Desplegar
chmod +x deploy/ovh/full-deploy.sh
bash deploy/ovh/full-deploy.sh

# 6. Configurar Nginx
chmod +x deploy/ovh/configure-nginx.sh
bash deploy/ovh/configure-nginx.sh tu-dominio.com

# 7. Configurar SSL
chmod +x deploy/ovh/setup-ssl.sh
bash deploy/ovh/setup-ssl.sh tu-dominio.com tu-email@ejemplo.com

# 8. Verificar
pm2 status
curl https://tu-dominio.com
```

---

¡Listo! Tu aplicación debería estar funcionando en OVH. 🎉
