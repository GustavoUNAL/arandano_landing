#!/bin/bash

# Script de configuración para EC2 - Arándano Café Bar
# Ejecutar con: bash setup-ec2.sh

set -e  # Salir si hay algún error

echo "🚀 Iniciando configuración de EC2 para Arándano Café Bar..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que se ejecuta como root o con sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Este script requiere permisos de sudo${NC}"
    echo "Ejecuta: sudo bash setup-ec2.sh"
    exit 1
fi

# Solicitar dominio
read -p "Ingresa tu dominio (ej: arandanocafe.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Debes ingresar un dominio${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}📦 Actualizando sistema...${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${GREEN}📦 Instalando Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo ""
echo -e "${GREEN}✅ Node.js instalado: $(node --version)${NC}"
echo -e "${GREEN}✅ npm instalado: $(npm --version)${NC}"

echo ""
echo -e "${GREEN}📦 Instalando PM2...${NC}"
npm install -g pm2

echo ""
echo -e "${GREEN}📦 Instalando Nginx...${NC}"
apt install -y nginx

echo ""
echo -e "${GREEN}📦 Instalando Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

echo ""
echo -e "${GREEN}📝 Configurando Nginx...${NC}"

# Crear configuración de Nginx
NGINX_CONFIG="/etc/nginx/sites-available/arandano"
cat > $NGINX_CONFIG <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Logs
    access_log /var/log/nginx/arandano-access.log;
    error_log /var/log/nginx/arandano-error.log;

    # Configuración para Next.js
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
EOF

# Habilitar sitio
ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/

# Eliminar configuración por defecto si existe
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Verificar configuración
if nginx -t; then
    echo -e "${GREEN}✅ Configuración de Nginx válida${NC}"
    systemctl restart nginx
    systemctl enable nginx
else
    echo -e "${RED}❌ Error en la configuración de Nginx${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}📝 Configurando aplicación Next.js...${NC}"

# Detectar directorio del proyecto
PROJECT_DIR=""
if [ -d "$HOME/ARANDANO" ]; then
    PROJECT_DIR="$HOME/ARANDANO"
elif [ -d "/home/ubuntu/ARANDANO" ]; then
    PROJECT_DIR="/home/ubuntu/ARANDANO"
elif [ -d "/var/www/ARANDANO" ]; then
    PROJECT_DIR="/var/www/ARANDANO"
else
    read -p "Ingresa la ruta completa del directorio del proyecto: " PROJECT_DIR
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Directorio no encontrado: $PROJECT_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}📁 Directorio del proyecto: $PROJECT_DIR${NC}"

cd "$PROJECT_DIR"

# Instalar dependencias
echo ""
echo -e "${GREEN}📦 Instalando dependencias...${NC}"
npm install

# Build de producción
echo ""
echo -e "${GREEN}🔨 Creando build de producción...${NC}"
npm run build

# Configurar PM2
echo ""
echo -e "${GREEN}🚀 Configurando PM2...${NC}"

# Detener proceso si ya existe
pm2 delete arandano-app 2>/dev/null || true

# Iniciar aplicación
pm2 start npm --name "arandano-app" -- start

# Configurar PM2 para iniciar al arrancar
pm2 startup | grep -v "PM2" | bash || true
pm2 save

echo ""
echo -e "${GREEN}✅ Aplicación iniciada con PM2${NC}"

# Configurar firewall (opcional)
read -p "¿Deseas configurar el firewall UFW? (y/n): " SETUP_FIREWALL
if [ "$SETUP_FIREWALL" = "y" ] || [ "$SETUP_FIREWALL" = "Y" ]; then
    echo ""
    echo -e "${GREEN}🔥 Configurando firewall...${NC}"
    apt install -y ufw
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo -e "${GREEN}✅ Firewall configurado${NC}"
fi

echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Antes de configurar SSL, asegúrate de que:${NC}"
echo "   1. Tu dominio apunta a esta IP (verifica con: dig $DOMAIN)"
echo "   2. Los Security Groups en AWS permiten tráfico en puertos 80 y 443"
echo ""
read -p "¿Tu dominio ya está apuntando a esta IP? (y/n): " DNS_READY

if [ "$DNS_READY" = "y" ] || [ "$DNS_READY" = "Y" ]; then
    echo ""
    echo -e "${GREEN}🔒 Configurando SSL con Let's Encrypt...${NC}"
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || {
        echo -e "${YELLOW}⚠️  No se pudo configurar SSL automáticamente${NC}"
        echo "Ejecuta manualmente: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    }
else
    echo ""
    echo -e "${YELLOW}⚠️  Configura SSL más tarde con:${NC}"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

echo ""
echo -e "${GREEN}✅ Configuración completada!${NC}"
echo ""
echo "📋 Resumen:"
echo "   - Dominio: $DOMAIN"
echo "   - Aplicación: Corriendo en PM2 (puerto 3000)"
echo "   - Nginx: Configurado como reverse proxy"
echo ""
echo "🔍 Comandos útiles:"
echo "   - Ver estado PM2: pm2 status"
echo "   - Ver logs: pm2 logs arandano-app"
echo "   - Reiniciar app: pm2 restart arandano-app"
echo "   - Reiniciar Nginx: sudo systemctl restart nginx"
echo ""
echo "🌐 Prueba tu sitio en: http://$DOMAIN"

