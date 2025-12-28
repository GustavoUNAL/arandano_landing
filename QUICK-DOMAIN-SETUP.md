# Configuración Rápida de Dominio 🚀

Guía rápida para configurar tu dominio con Nginx y SSL.

## ⚡ Configuración Rápida (Recomendado)

### 1. Conéctate a tu instancia EC2

```bash
ssh -i tu-clave.pem ubuntu@tu-ip-publica
```

### 2. Verifica que la aplicación esté corriendo

```bash
pm2 status
```

Si no está corriendo:
```bash
cd ~/projects/arandano_landing  # o donde tengas el proyecto
npm run build
pm2 start npm --name "arandano-app" -- start
pm2 save
```

### 3. Configura DNS en tu proveedor de dominio

En tu proveedor (GoDaddy, Namecheap, Cloudflare, etc.), agrega:

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

### 4. Ejecuta el script de configuración

```bash
# Si tienes el script en tu proyecto
cd ~/projects/arandano_landing
bash setup-domain.sh tu-dominio.com

# O descárgalo desde GitHub si ya lo subiste
```

El script:
- ✅ Configurará Nginx con tu dominio
- ✅ Habilitará el sitio
- ✅ Te preguntará si quieres configurar SSL

### 5. Configurar SSL (Recomendado)

Cuando el script pregunte, responde `y` y sigue las instrucciones.

O manualmente:
```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## 📋 Configuración Manual

Si prefieres hacerlo manualmente:

### Paso 1: Crear configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/arandano
```

Pega esta configuración (reemplaza `tu-dominio.com`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tu-dominio.com www.tu-dominio.com;

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
}
```

Guarda (Ctrl+O, Enter, Ctrl+X)

### Paso 2: Habilitar el sitio

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

### Paso 3: Configurar SSL

```bash
# Instalar Certbot (si no está instalado)
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## 🔒 Configurar Security Groups en AWS

Asegúrate de que estos puertos estén abiertos:

1. Ve a **EC2 Console** → **Security Groups**
2. Selecciona el Security Group de tu instancia
3. Agrega reglas de entrada:

```
HTTP:
- Tipo: HTTP
- Puerto: 80
- Origen: 0.0.0.0/0

HTTPS:
- Tipo: HTTPS
- Puerto: 443
- Origen: 0.0.0.0/0

SSH (opcional, para seguridad):
- Tipo: SSH
- Puerto: 22
- Origen: Tu IP específica
```

## ✅ Verificación

### Verificar que todo funciona:

```bash
# Estado de PM2
pm2 status

# Estado de Nginx
sudo systemctl status nginx

# Ver logs
pm2 logs arandano-app
sudo tail -f /var/log/nginx/arandano-error.log

# Verificar que el puerto 3000 está escuchando
sudo netstat -tlnp | grep 3000
```

### Probar en el navegador:

1. Visita `http://tu-dominio.com` (debería redirigir a HTTPS si configuraste SSL)
2. Visita `https://tu-dominio.com`
3. Verifica que todas las páginas carguen correctamente

## 🔧 Comandos Útiles

```bash
# Reiniciar aplicación
pm2 restart arandano-app

# Reiniciar Nginx
sudo systemctl restart nginx

# Recargar Nginx (sin downtime)
sudo nginx -s reload

# Ver certificados SSL
sudo certbot certificates

# Renovar certificado SSL manualmente
sudo certbot renew

# Verificar renovación automática
sudo certbot renew --dry-run
```

## ❌ Solución de Problemas

### La aplicación no carga

1. Verifica PM2: `pm2 status`
2. Verifica Nginx: `sudo systemctl status nginx`
3. Verifica logs: `pm2 logs arandano-app` y `sudo tail -f /var/log/nginx/arandano-error.log`
4. Verifica puerto 3000: `sudo netstat -tlnp | grep 3000`

### Error de DNS

1. Verifica propagación DNS: https://www.whatsmydns.net/
2. Verifica que los registros A apunten a la IP correcta
3. Espera hasta 48 horas para propagación completa

### Error 502 Bad Gateway

- La aplicación no está corriendo: `pm2 restart arandano-app`
- Nginx no puede conectar: verifica que PM2 esté corriendo

### Error de SSL

1. Verifica que los puertos 80 y 443 estén abiertos en Security Groups
2. Verifica que Nginx esté corriendo: `sudo systemctl status nginx`
3. Revisa certificados: `sudo certbot certificates`

## 📝 Checklist Final

- [ ] DNS configurado y propagado (verificar en whatsmydns.net)
- [ ] Aplicación corriendo con PM2 (`pm2 status`)
- [ ] Nginx configurado y corriendo (`sudo systemctl status nginx`)
- [ ] Security Groups configurados (puertos 80 y 443)
- [ ] SSL configurado (si aplica)
- [ ] Sitio accesible vía HTTPS
- [ ] PM2 configurado para iniciar al arrancar (`pm2 startup` y `pm2 save`)

¡Listo! Tu aplicación debería estar funcionando con tu dominio. 🎉

