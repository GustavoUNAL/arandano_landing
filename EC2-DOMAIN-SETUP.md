# Configuración de Dominio para EC2 - Arándano Café Bar

Esta guía te ayudará a configurar tu dominio para que apunte a tu instancia EC2 y servir tu aplicación Next.js con Nginx y SSL.

## Prerrequisitos

- Instancia EC2 corriendo con Ubuntu/Debian
- Dominio registrado (ej: `arandanocafe.com`)
- Acceso SSH a tu instancia EC2
- IP pública de tu instancia EC2

---

## Paso 1: Configurar DNS en tu Proveedor de Dominio

### Para un dominio principal (ej: arandanocafe.com)

Agrega los siguientes registros DNS en tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.):

```
Tipo: A
Nombre: @ (o deja en blanco)
Valor: [TU_IP_PUBLICA_EC2]
TTL: 3600 (o el mínimo permitido)
```

### Para un subdominio (ej: www.arandanocafe.com)

```
Tipo: A
Nombre: www
Valor: [TU_IP_PUBLICA_EC2]
TTL: 3600
```

**Nota:** La propagación DNS puede tardar entre 5 minutos y 48 horas. Normalmente es entre 15-30 minutos.

---

## Paso 2: Conectarse a tu Instancia EC2

```bash
ssh -i tu-clave.pem ubuntu@tu-ip-publica-ec2
# o
ssh -i tu-clave.pem ec2-user@tu-ip-publica-ec2  # Para Amazon Linux
```

---

## Paso 3: Instalar Dependencias en EC2

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

---

## Paso 4: Configurar la Aplicación Next.js

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

---

## Paso 5: Configurar Nginx como Reverse Proxy

### Crear archivo de configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/arandano
```

Pega la siguiente configuración (reemplaza `tu-dominio.com` con tu dominio real):

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

Guarda el archivo (Ctrl+O, Enter, Ctrl+X).

### Habilitar el sitio

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/arandano /etc/nginx/sites-enabled/

# Eliminar configuración por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Habilitar Nginx al iniciar
sudo systemctl enable nginx
```

---

## Paso 6: Configurar SSL con Let's Encrypt

```bash
# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Seguir las instrucciones:
# - Ingresa tu email
# - Acepta los términos
# - Elige si quieres redirigir HTTP a HTTPS (recomendado: Sí)
```

Certbot modificará automáticamente tu configuración de Nginx para incluir SSL.

### Renovación automática

Let's Encrypt expira cada 90 días. Certbot configura la renovación automática, pero puedes probarla:

```bash
# Probar renovación
sudo certbot renew --dry-run
```

---

## Paso 7: Configurar Security Groups en AWS

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

---

## Paso 8: Verificar que Todo Funciona

```bash
# Verificar estado de PM2
pm2 status

# Ver logs de la aplicación
pm2 logs arandano-app

# Verificar estado de Nginx
sudo systemctl status nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/arandano-error.log
```

### Probar en el navegador

1. Visita `http://tu-dominio.com` (debería redirigir a HTTPS)
2. Visita `https://tu-dominio.com`
3. Verifica que todas las páginas carguen correctamente

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

### Actualizar la Aplicación

```bash
cd ~/ARANDANO

# Pull de cambios (si usas git)
git pull origin main

# Instalar nuevas dependencias
npm install

# Rebuild
npm run build

# Reiniciar con PM2
pm2 restart arandano-app
```

---

## Solución de Problemas

### La aplicación no carga

1. Verifica que PM2 esté corriendo: `pm2 status`
2. Verifica que Nginx esté corriendo: `sudo systemctl status nginx`
3. Verifica los logs: `pm2 logs` y `sudo tail -f /var/log/nginx/arandano-error.log`
4. Verifica que el puerto 3000 esté escuchando: `sudo netstat -tlnp | grep 3000`

### Error de DNS

1. Verifica la propagación DNS: https://www.whatsmydns.net/
2. Verifica que los registros A apunten a la IP correcta
3. Espera hasta 48 horas para propagación completa

### Error de SSL

1. Verifica que los puertos 80 y 443 estén abiertos en Security Groups
2. Verifica que Nginx esté corriendo: `sudo systemctl status nginx`
3. Revisa los logs de Certbot: `sudo certbot certificates`

### La aplicación se cae después de desconectarse

Asegúrate de que PM2 esté configurado para iniciar al arrancar:
```bash
pm2 startup
pm2 save
```

---

## Configuración de Firewall (UFW) - Opcional pero Recomendado

```bash
# Instalar UFW
sudo apt install -y ufw

# Permitir SSH (importante hacerlo primero)
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

---

## Checklist Final

- [ ] DNS configurado y propagado
- [ ] Node.js y npm instalados
- [ ] Aplicación construida y corriendo con PM2
- [ ] Nginx configurado como reverse proxy
- [ ] SSL configurado con Let's Encrypt
- [ ] Security Groups configurados en AWS
- [ ] Aplicación accesible vía HTTPS
- [ ] PM2 configurado para iniciar al arrancar
- [ ] Firewall configurado (opcional)

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

