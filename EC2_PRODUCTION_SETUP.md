# 🚀 Guía de Despliegue en EC2 - Producción

## ✅ Checklist Pre-Despliegue

### En tu Máquina Local
- [x] Build compilado sin errores
- [x] Firebase configurado y datos migrados
- [x] Variables de entorno documentadas
- [x] Scripts de backup creados

## 📋 Pasos para Desplegar en EC2

### 1. Preparar el Servidor EC2

```bash
# Conectarse a EC2
ssh -i tu-clave.pem ubuntu@tu-ip-ec2

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar versión
node --version  # Debe ser v18.x o superior
npm --version

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx
```

### 2. Subir el Proyecto

**Opción A: Con Git (Recomendado)**
```bash
cd ~
git clone tu-repositorio ARANDANO
cd ARANDANO
```

**Opción B: Con SCP (desde tu máquina local)**
```bash
# Desde tu máquina local
scp -r -i tu-clave.pem ./ARANDANO ubuntu@tu-ip-ec2:~/
```

### 3. Configurar Variables de Entorno

```bash
cd ~/ARANDANO
nano .env.local
```

**Contenido de `.env.local` en producción:**

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD-ve9dIks9sc3o9hqtIUmXKAC-lPtSvoc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=arandanocafe.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=arandanocafe
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=arandanocafe.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=899760377796
NEXT_PUBLIC_FIREBASE_APP_ID=1:899760377796:web:30be09c98759c6e8591e91

# Database Mode: usar 'firebase' en producción
DB_MODE=firebase

# Admin Password (cambiar por una contraseña segura)
ADMIN_PASSWORD=tu_password_seguro_aqui
```

**Para Service Account:**

```bash
# Subir archivo desde tu máquina local
scp -i tu-clave.pem firebase-service-account.json ubuntu@tu-ip-ec2:~/ARANDANO/
```

**O usar variable de entorno (más seguro):**

```bash
# En .env.local, agrega:
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"arandanocafe",...}
# (pega todo el contenido del JSON como una línea)
```

### 4. Instalar Dependencias y Build

```bash
cd ~/ARANDANO

# Instalar dependencias
npm install

# Crear build de producción
npm run build

# Verificar que el build funcionó
ls -la .next
```

### 5. Configurar PM2

```bash
# Iniciar aplicación con PM2
pm2 start npm --name "arandano-app" -- start

# Configurar para iniciar al arrancar el servidor
pm2 startup
# Ejecuta el comando que te muestre (algo como: sudo env PATH=...)
pm2 save

# Verificar estado
pm2 status
pm2 logs arandano-app --lines 50
```

### 6. Configurar Nginx

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/arandano
```

**Contenido del archivo:**

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    # O usar IP si no tienes dominio: server_name _;

    # Logs
    access_log /var/log/nginx/arandano-access.log;
    error_log /var/log/nginx/arandano-error.log;

    # Tamaño máximo de upload
    client_max_body_size 10M;

    # Configuración para Next.js
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache para archivos estáticos
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Cache para imágenes
    location /images {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/arandano /etc/nginx/sites-enabled/

# Eliminar default si existe
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7. Configurar Firewall

```bash
# Permitir puertos necesarios
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS (si usas SSL)
sudo ufw enable
sudo ufw status
```

### 8. Verificar Despliegue

```bash
# Verificar que la app está corriendo
pm2 status
pm2 logs arandano-app --lines 20

# Probar que responde
curl http://localhost:3000

# Verificar Nginx
sudo systemctl status nginx
```

## 🔄 Actualizar la Aplicación

```bash
cd ~/ARANDANO

# Si usas Git
git pull origin main

# O subir archivos nuevos con SCP

# Reinstalar dependencias si hay cambios
npm install

# Rebuild
npm run build

# Reiniciar con PM2
pm2 restart arandano-app
```

## 📊 Comandos Útiles

```bash
# Ver logs en tiempo real
pm2 logs arandano-app

# Reiniciar aplicación
pm2 restart arandano-app

# Detener aplicación
pm2 stop arandano-app

# Ver estado
pm2 status

# Ver uso de recursos
pm2 monit

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/arandano-access.log
sudo tail -f /var/log/nginx/arandano-error.log
```

## 🔒 SSL/HTTPS (Opcional pero Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática (ya viene configurada)
sudo certbot renew --dry-run
```

## 🛡️ Seguridad

1. **Cambiar contraseña de admin** en `.env.local`
2. **No subir** `firebase-service-account.json` a Git
3. **Configurar firewall** correctamente
4. **Usar SSL** en producción
5. **Mantener actualizado** el sistema y dependencias

## 📈 Monitoreo

- **PM2**: `pm2 monit` - Monitoreo en tiempo real
- **Logs**: `pm2 logs` - Ver logs de la aplicación
- **Nginx**: `/var/log/nginx/` - Logs de acceso y errores
- **Firebase**: Firebase Console - Uso y almacenamiento

## 🚨 Troubleshooting

### La app no inicia
```bash
pm2 logs arandano-app
# Revisar errores en los logs
```

### Error de conexión a Firebase
- Verificar que `.env.local` tenga todas las variables
- Verificar que `firebase-service-account.json` esté presente
- Revisar reglas de Firestore en Firebase Console

### Nginx no funciona
```bash
sudo nginx -t  # Verificar configuración
sudo systemctl restart nginx
```

### Puerto 3000 no responde
```bash
# Verificar que PM2 esté corriendo
pm2 status
# Verificar que el puerto esté en uso
sudo netstat -tlnp | grep 3000
```

