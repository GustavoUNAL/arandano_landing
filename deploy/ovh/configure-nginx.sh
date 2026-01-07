#!/bin/bash

###############################################################################
# Configuración de Nginx para Arándano Café Bar en OVH
# 
# Este script configura Nginx como reverse proxy
# Uso: bash deploy/ovh/configure-nginx.sh [dominio]
###############################################################################

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables
DOMAIN="${1:-arandanocafe.com}"
PM2_APP_NAME="arandano-app"
APP_PORT=3000
NGINX_SITE="$PM2_APP_NAME"
NGINX_CONFIG="/etc/nginx/sites-available/$NGINX_SITE"
NGINX_ENABLED="/etc/nginx/sites-enabled/$NGINX_SITE"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  ⚙️  CONFIGURACIÓN DE NGINX${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar que Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx no está instalado${NC}"
    echo "   Instala Nginx primero: sudo apt install -y nginx"
    exit 1
fi

# Crear configuración de Nginx
echo -e "${BLUE}📄 Creando configuración de Nginx...${NC}"

sudo tee "$NGINX_CONFIG" > /dev/null <<EOF
# Configuración de Nginx para Arándano Café Bar
# Generado automáticamente

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=general_limit:10m rate=30r/s;

# Redirigir HTTP a HTTPS (descomentar después de configurar SSL)
# server {
#     listen 80;
#     listen [::]:80;
#     server_name $DOMAIN www.$DOMAIN;
#     return 301 https://\$server_name\$request_uri;
# }

# Servidor HTTP (temporal, cambiar a HTTPS después)
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Logs
    access_log /var/log/nginx/${PM2_APP_NAME}-access.log;
    error_log /var/log/nginx/${PM2_APP_NAME}-error.log;

    # Tamaño máximo de upload
    client_max_body_size 10M;

    # Compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxying a la aplicación Next.js
    location / {
        limit_req zone=general_limit burst=20 nodelay;
        
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Rate limiting más estricto para APIs
    location /api/ {
        limit_req zone=api_limit burst=5 nodelay;
        
        proxy_pass http://localhost:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts más cortos para APIs
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Cache para assets estáticos
    location /_next/static/ {
        proxy_pass http://localhost:${APP_PORT};
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://localhost:${APP_PORT}/api/health;
    }

    # Denegar acceso a archivos sensibles
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# Configuración HTTPS (descomentar y configurar después de obtener certificado SSL)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name $DOMAIN www.$DOMAIN;
#
#     # Certificados SSL (generar con Certbot)
#     ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
#
#     # Configuración SSL moderna
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
#     ssl_prefer_server_ciphers off;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#
#     # HSTS
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#
#     # Resto de la configuración igual que HTTP
#     # ... (copiar configuración de arriba)
# }
EOF

echo -e "${GREEN}   ✅ Configuración creada: $NGINX_CONFIG${NC}"

# Habilitar sitio
if [ -L "$NGINX_ENABLED" ]; then
    echo -e "${YELLOW}   ⚠️  El sitio ya está habilitado${NC}"
else
    sudo ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
    echo -e "${GREEN}   ✅ Sitio habilitado${NC}"
fi

# Verificar configuración
echo ""
echo -e "${BLUE}🔍 Verificando configuración...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}   ✅ Configuración válida${NC}"
    
    # Recargar Nginx
    sudo systemctl reload nginx
    echo -e "${GREEN}   ✅ Nginx recargado${NC}"
else
    echo -e "${RED}   ❌ Error en la configuración${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ NGINX CONFIGURADO${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📝 Próximos pasos:${NC}"
echo "   1. Configurar DNS apuntando a la IP del servidor"
echo "   2. Obtener certificado SSL con Let's Encrypt:"
echo "      ${GREEN}sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
echo "   3. Descomentar la sección HTTPS en la configuración"
echo "   4. Recargar Nginx: ${GREEN}sudo systemctl reload nginx${NC}"
echo ""
echo -e "${CYAN}🔍 Verificar:${NC}"
echo "   - Status: ${GREEN}sudo systemctl status nginx${NC}"
echo "   - Logs:   ${GREEN}sudo tail -f /var/log/nginx/${PM2_APP_NAME}-error.log${NC}"
echo ""

