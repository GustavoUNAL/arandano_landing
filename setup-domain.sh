#!/bin/bash

# Script para configurar dominio con Nginx y SSL
# Uso: bash setup-domain.sh tu-dominio.com

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Debes proporcionar tu dominio${NC}"
    echo "Uso: bash setup-domain.sh tu-dominio.com"
    exit 1
fi

DOMAIN=$1
NGINX_CONFIG="/etc/nginx/sites-available/arandano"

echo -e "${BLUE}🌐 Configurando dominio: ${DOMAIN}${NC}"
echo ""

# Verificar que Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx no está instalado. Instalando...${NC}"
    sudo apt update
    sudo apt install -y nginx
fi

# Verificar que PM2 está corriendo
if ! pm2 list | grep -q "arandano-app"; then
    echo -e "${RED}❌ La aplicación no está corriendo con PM2${NC}"
    echo "Por favor, inicia la aplicación primero:"
    echo "  cd ~/projects/arandano_landing"
    echo "  npm run build"
    echo "  pm2 start npm --name 'arandano-app' -- start"
    exit 1
fi

echo -e "${GREEN}✅ Aplicación corriendo con PM2${NC}"

# Crear configuración de Nginx
echo -e "${BLUE}📝 Creando configuración de Nginx...${NC}"
sudo tee $NGINX_CONFIG > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Logs
    access_log /var/log/nginx/arandano-access.log;
    error_log /var/log/nginx/arandano-error.log;

    # Configuración para Next.js - Reverse Proxy al puerto 3000
    location / {
        proxy_pass http://localhost:3000;
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

    # Cache para archivos estáticos de Next.js
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

    # Favicon y otros archivos estáticos
    location ~* \.(ico|css|js|gif|jpe?g|png|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Seguridad adicional
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Habilitar sitio
echo -e "${BLUE}🔗 Habilitando sitio en Nginx...${NC}"
sudo ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/

# Eliminar configuración por defecto si existe
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Verificar configuración
echo -e "${BLUE}🔍 Verificando configuración de Nginx...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Configuración de Nginx válida${NC}"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
else
    echo -e "${RED}❌ Error en la configuración de Nginx${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Nginx configurado correctamente${NC}"
echo ""

# Preguntar si quiere configurar SSL
read -p "¿Deseas configurar SSL con Let's Encrypt? (y/n): " SETUP_SSL

if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
    # Verificar que Certbot está instalado
    if ! command -v certbot &> /dev/null; then
        echo -e "${YELLOW}⚠️  Certbot no está instalado. Instalando...${NC}"
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    echo -e "${BLUE}🔒 Configurando SSL con Let's Encrypt...${NC}"
    echo "Asegúrate de que:"
    echo "  1. Tu dominio apunta a esta IP: $(curl -s ifconfig.me)"
    echo "  2. Los puertos 80 y 443 están abiertos en Security Groups"
    echo ""
    read -p "Presiona Enter cuando estés listo..."
    
    sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}
    
    echo ""
    echo -e "${GREEN}✅ SSL configurado correctamente!${NC}"
    echo ""
    echo "🌐 Tu aplicación debería estar disponible en:"
    echo "   - https://${DOMAIN}"
    echo "   - https://www.${DOMAIN}"
else
    echo ""
    echo -e "${YELLOW}ℹ️  SSL no configurado. Puedes configurarlo más tarde con:${NC}"
    echo "   sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
    echo ""
    echo "🌐 Tu aplicación debería estar disponible en:"
    echo "   - http://${DOMAIN}"
    echo "   - http://www.${DOMAIN}"
fi

echo ""
echo -e "${GREEN}✅ Configuración completada!${NC}"
echo ""
echo "📋 Verificar estado:"
echo "   - PM2: pm2 status"
echo "   - Nginx: sudo systemctl status nginx"
echo "   - Logs PM2: pm2 logs arandano-app"
echo "   - Logs Nginx: sudo tail -f /var/log/nginx/arandano-error.log"

