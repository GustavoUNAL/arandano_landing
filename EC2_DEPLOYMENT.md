# 🚀 Guía de Despliegue en EC2 - Arándano Café Bar

## 📋 Checklist Pre-Despliegue

- [x] Build compilado sin errores
- [x] Firebase configurado y datos migrados
- [x] Variables de entorno configuradas
- [x] Scripts de backup creados

## 🔧 Configuración en EC2

### Paso 1: Preparar el Servidor

```bash
# Conectarse a EC2
ssh -i tu-clave.pem ubuntu@tu-ip-ec2

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx
```

### Paso 2: Clonar/Subir el Proyecto

```bash
# Opción A: Si usas Git
cd ~
git clone tu-repositorio ARANDANO
cd ARANDANO

# Opción B: Subir archivos con SCP
# Desde tu máquina local:
# scp -r -i tu-clave.pem ./ARANDANO ubuntu@tu-ip-ec2:~/
```

### Paso 3: Configurar Variables de Entorno

```bash
cd ~/ARANDANO

# Crear .env.local con las variables de Firebase
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

# Firebase Service Account (como variable de entorno)
# O usar archivo firebase-service-account.json
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Admin Password
ADMIN_PASSWORD=tu_password_seguro_aqui
```

**Para Service Account en producción (recomendado):**

1. Sube el archivo `firebase-service-account.json` al servidor
2. O convierte el JSON a variable de entorno (más seguro)

```bash
# Opción: Subir archivo
scp -i tu-clave.pem firebase-service-account.json ubuntu@tu-ip-ec2:~/ARANDANO/
```

### Paso 4: Instalar y Build

```bash
cd ~/ARANDANO

# Instalar dependencias
npm install --production

# Crear build de producción
npm run build

# Verificar que el build funcionó
ls -la .next
```

### Paso 5: Configurar PM2

```bash
# Iniciar aplicación con PM2
pm2 start npm --name "arandano-app" -- start

# Configurar para iniciar al arrancar el servidor
pm2 startup
# Ejecuta el comando que te muestre
pm2 save

# Verificar estado
pm2 status
pm2 logs arandano-app
```

### Paso 6: Configurar Nginx

```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/arandano
```

**Contenido:**

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Logs
    access_log /var/log/nginx/arandano-access.log;
    error_log /var/log/nginx/arandano-error.log;

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

### Paso 7: Configurar SSL (Opcional pero Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

### Paso 8: Configurar Firewall

```bash
# Permitir puertos necesarios
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Verificar
sudo ufw status
```

## 🔄 Actualizar la Aplicación

```bash
cd ~/ARANDANO

# Si usas Git
git pull origin main

# Instalar nuevas dependencias
npm install --production

# Rebuild
npm run build

# Reiniciar con PM2
pm2 restart arandano-app

# Ver logs
pm2 logs arandano-app --lines 50
```

## 📊 Monitoreo

```bash
# Ver estado de PM2
pm2 status

# Ver uso de recursos
pm2 monit

# Ver logs en tiempo real
pm2 logs arandano-app

# Ver logs de Nginx
sudo tail -f /var/log/nginx/arandano-access.log
sudo tail -f /var/log/nginx/arandano-error.log
```

## 🔒 Seguridad en Producción

1. **Variables de entorno**: Nunca subas `.env.local` a Git
2. **Service Account**: Usa variable de entorno en lugar de archivo
3. **Firewall**: Solo puertos necesarios abiertos
4. **SSL**: Siempre usar HTTPS en producción
5. **Backups**: Configurar backups automáticos de Firebase

## 🐛 Solución de Problemas

### La aplicación no inicia

```bash
# Ver logs de PM2
pm2 logs arandano-app

# Verificar que el puerto 3000 esté libre
sudo netstat -tulpn | grep 3000

# Verificar variables de entorno
cat .env.local
```

### Error de Firebase

```bash
# Verificar Service Account
ls -la firebase-service-account.json

# Probar conexión
npm run test:firebase
```

### Nginx no funciona

```bash
# Verificar configuración
sudo nginx -t

# Ver logs de error
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 📝 Notas Importantes

- **DB_MODE**: Usar `firebase` en producción (no `json` ni `hybrid`)
- **Backups**: Firebase hace backups automáticos, pero también puedes hacer manuales
- **Actualizaciones**: Siempre hacer backup antes de actualizar
- **Monitoreo**: Revisar logs regularmente

