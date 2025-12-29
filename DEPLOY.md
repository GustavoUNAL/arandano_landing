# Guía de Despliegue - Arándano Café Bar

Esta guía cubre todas las opciones de despliegue para Arándano Café Bar.

## 📋 Tabla de Contenidos

1. [Despliegue en EC2 (AWS)](#despliegue-en-ec2-aws)
2. [Configuración de Dominio y SSL](#configuración-de-dominio-y-ssl)
3. [Despliegue en Vercel/Netlify](#despliegue-en-vercelnetlify)
4. [Despliegue Automático con GitHub Actions](#despliegue-automático-con-github-actions)
5. [Comandos Útiles](#comandos-útiles)
6. [Solución de Problemas](#solución-de-problemas)

---

## Despliegue en EC2 (AWS)

### Prerrequisitos

- Instancia EC2 corriendo con Ubuntu/Debian
- Acceso SSH a tu instancia EC2
- IP pública de tu instancia EC2

### Paso 1: Instalar Dependencias en EC2

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version
npm --version

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot (para SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### Paso 2: Configurar la Aplicación

```bash
# Navegar al directorio del proyecto
cd ~/ARANDANO  # o donde tengas el proyecto

# Instalar dependencias
npm install

# Crear build de producción
npm run build

# Iniciar con PM2
pm2 start npm --name "arandano-app" -- start

# Configurar PM2 para iniciar al reiniciar el servidor
pm2 startup
pm2 save
```

### Paso 3: Verificar que Funciona

```bash
# Ver estado de PM2
pm2 status

# Ver logs
pm2 logs arandano-app

# Probar localmente
curl http://localhost:3000
```

---

## Configuración de Dominio y SSL

### Paso 1: Configurar DNS

En tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.), agrega:

**Registro A para el dominio principal:**
```
Tipo: A
Nombre: @ (o deja en blanco)
Valor: [TU_IP_PUBLICA_EC2]
TTL: 3600
```

**Registro A para www:**
```
Tipo: A
Nombre: www
Valor: [TU_IP_PUBLICA_EC2]
TTL: 3600
```

**Nota:** La propagación DNS puede tardar entre 5 minutos y 48 horas. Normalmente es entre 15-30 minutos.

### Paso 2: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/arandano
```

Pega esta configuración (reemplaza `arandanocafe.com` con tu dominio):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name arandanocafe.com www.arandanocafe.com;

    access_log /var/log/nginx/arandano-access.log;
    error_log /var/log/nginx/arandano-error.log;

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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    location /images {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.(ico|css|js|gif|jpe?g|png|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Habilitar el sitio:

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/arandano /etc/nginx/sites-enabled/

# Eliminar configuración por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Paso 3: Configurar SSL con Let's Encrypt

```bash
# Obtener certificado SSL
sudo certbot --nginx -d arandanocafe.com -d www.arandanocafe.com

# Seguir las instrucciones:
# - Ingresa tu email
# - Acepta los términos
# - Elige si quieres redirigir HTTP a HTTPS (recomendado: Sí)
```

Certbot modificará automáticamente tu configuración de Nginx para incluir SSL.

### Paso 4: Configurar Security Groups en AWS

Asegúrate de que tu Security Group en AWS permita el tráfico necesario:

1. Ve a **EC2 Console** → **Security Groups**
2. Selecciona el Security Group de tu instancia
3. Agrega las siguientes reglas de entrada:

```
Tipo: HTTP
Puerto: 80
Origen: 0.0.0.0/0

Tipo: HTTPS
Puerto: 443
Origen: 0.0.0.0/0

Tipo: SSH
Puerto: 22
Origen: Tu IP (para seguridad)
```

### Scripts de Ayuda

El proyecto incluye scripts útiles:

- **`setup-https.sh`** - Configura HTTPS automáticamente
- **`deploy.sh`** - Script de despliegue rápido en EC2
- **`setup-domain.sh`** - Configura dominio y Nginx
- **`setup-ec2.sh`** - Configuración inicial de EC2

---

## Despliegue en Vercel/Netlify

### Vercel (Recomendado para Next.js)

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Desplegar:**
```bash
vercel
```

3. **O conectar GitHub:**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu repositorio de GitHub
   - Vercel detectará automáticamente Next.js y desplegará

### Netlify

1. **Instalar Netlify CLI:**
```bash
npm i -g netlify-cli
```

2. **Desplegar:**
```bash
npm run build
netlify deploy --prod --dir=.next
```

### Otras Plataformas

- **Railway:** Conecta el repositorio directamente
- **Render:** Selecciona Next.js como framework
- **AWS Amplify:** Conecta el repositorio

---

## Despliegue Automático con GitHub Actions

### Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub
2. Navega a **Settings** → **Secrets and variables** → **Actions**
3. Agrega los siguientes secrets:

#### EC2_HOST
- **Nombre**: `EC2_HOST`
- **Valor**: La IP pública o dominio de tu EC2 (ej: `arandanocafe.com`)

#### EC2_USER
- **Nombre**: `EC2_USER`
- **Valor**: El usuario SSH (generalmente `ubuntu`)

#### EC2_SSH_KEY
- **Nombre**: `EC2_SSH_KEY`
- **Valor**: Todo el contenido de tu archivo `.pem` (clave privada SSH)

### Crear Workflow

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to EC2
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USER }}
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd ~/ARANDANO
          git fetch origin
          git reset --hard origin/main
          npm ci
          npm run build
          pm2 restart arandano-app
```

El script `deploy-auto.sh` está diseñado para ser usado por GitHub Actions.

---

## Comandos Útiles

### Gestión de PM2

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs arandano-app

# Reiniciar aplicación
pm2 restart arandano-app

# Detener aplicación
pm2 stop arandano-app

# Eliminar aplicación de PM2
pm2 delete arandano-app

# Ver uso de recursos
pm2 monit
```

### Gestión de Nginx

```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Recargar configuración (sin downtime)
sudo nginx -s reload

# Verificar configuración
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/arandano-error.log
```

### Gestión de SSL

```bash
# Ver certificados SSL
sudo certbot certificates

# Renovar certificado SSL manualmente
sudo certbot renew

# Verificar renovación automática
sudo certbot renew --dry-run
```

### Actualizar la Aplicación

```bash
cd ~/ARANDANO

# Si usas Git:
git pull origin main

# Instalar nuevas dependencias (si hay)
npm install

# Rebuild
npm run build

# Reiniciar
pm2 restart arandano-app
```

---

## Solución de Problemas

### La aplicación no carga

1. Verifica que PM2 esté corriendo: `pm2 status`
2. Verifica que Nginx esté corriendo: `sudo systemctl status nginx`
3. Verifica los logs: `pm2 logs arandano-app` y `sudo tail -f /var/log/nginx/arandano-error.log`
4. Verifica que el puerto 3000 esté escuchando: `sudo netstat -tlnp | grep 3000`

### Error de DNS

1. Verifica la propagación DNS: https://www.whatsmydns.net/
2. Verifica que los registros A apunten a la IP correcta
3. Espera hasta 48 horas para propagación completa

### Error de SSL

1. Verifica que los puertos 80 y 443 estén abiertos en Security Groups
2. Verifica que Nginx esté corriendo: `sudo systemctl status nginx`
3. Revisa certificados: `sudo certbot certificates`

### Error 502 Bad Gateway

- La aplicación no está corriendo: `pm2 restart arandano-app`
- Nginx no puede conectar: verifica que PM2 esté corriendo

### La aplicación se cae después de desconectarse

Asegúrate de que PM2 esté configurado para iniciar al arrancar:
```bash
pm2 startup
pm2 save
```

### Error de puerto en uso

```bash
# Ver qué está usando el puerto 3000
sudo lsof -i :3000

# Matar el proceso si es necesario
pm2 delete arandano-app
pm2 start npm --name "arandano-app" -- start
```

---

## Checklist de Despliegue

### Despliegue Inicial

- [ ] Instancias EC2 configurada
- [ ] Node.js y npm instalados
- [ ] PM2 instalado y configurado
- [ ] Aplicación construida y corriendo con PM2
- [ ] Nginx instalado y configurado
- [ ] DNS configurado y propagado
- [ ] SSL configurado con Let's Encrypt
- [ ] Security Groups configurados en AWS
- [ ] Aplicación accesible vía HTTPS
- [ ] PM2 configurado para iniciar al arrancar

### Actualización

- [ ] Código actualizado (git pull)
- [ ] Dependencias actualizadas (npm install)
- [ ] Build exitoso (npm run build)
- [ ] Aplicación reiniciada (pm2 restart arandano-app)
- [ ] Verificación en producción

---

## Notas Adicionales

- **Backup:** Considera configurar backups automáticos de tu base de datos y archivos
- **Monitoreo:** Puedes usar PM2 Plus o herramientas como New Relic para monitoreo
- **CDN:** Para mejor rendimiento, considera usar CloudFront de AWS
- **Escalabilidad:** Si necesitas escalar, considera usar un Load Balancer de AWS

---

## Soporte

Si tienes problemas, verifica:
1. Logs de PM2: `pm2 logs`
2. Logs de Nginx: `sudo tail -f /var/log/nginx/arandano-error.log`
3. Estado de servicios: `pm2 status` y `sudo systemctl status nginx`
