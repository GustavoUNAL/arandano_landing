#!/bin/bash

###############################################################################
# Script de Despliegue Completo para OVH/EC2
# Arándano Café Bar - arandanocafe.com
# 
# Este script realiza un despliegue completo:
# 1. Build de producción
# 2. Configuración de PM2
# 3. Configuración de Nginx con dominio arandanocafe.com
# 4. Verificación de todo el sistema
# 
# Uso: bash deploy/ovh/full-deploy.sh
###############################################################################

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
DOMAIN="arandanocafe.com"
PM2_APP_NAME="arandano-app"
NODE_ENV="production"
PORT=3000

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 DESPLIEGUE COMPLETO - ARÁNDANO CAFÉ BAR${NC}"
echo -e "${BLUE}  Dominio: ${DOMAIN}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar que estamos en el directorio correcto
# Buscar package.json en el directorio actual o en directorios comunes
if [ ! -f "package.json" ]; then
    # Intentar encontrar el proyecto en ubicaciones comunes
    POSSIBLE_DIRS=(
        "${HOME}/projects/arandano_landing"
        "${HOME}/arandano"
        "${HOME}/projects/arandano"
        "/home/ubuntu/projects/arandano_landing"
        "/home/ubuntu/arandano"
    )
    
    FOUND=false
    for DIR in "${POSSIBLE_DIRS[@]}"; do
        if [ -d "$DIR" ] && [ -f "$DIR/package.json" ]; then
            cd "$DIR"
            echo -e "${YELLOW}   📁 Cambiando al directorio: $DIR${NC}"
            FOUND=true
            break
        fi
    done
    
    if [ "$FOUND" = false ]; then
        echo -e "${RED}❌ No se encontró package.json${NC}"
        echo -e "${YELLOW}   Por favor, ejecuta este script desde el directorio del proyecto${NC}"
        echo -e "${YELLOW}   o asegúrate de que el proyecto esté en una de estas ubicaciones:${NC}"
        for DIR in "${POSSIBLE_DIRS[@]}"; do
            echo -e "${YELLOW}     - $DIR${NC}"
        done
    exit 1
    fi
fi

CURRENT_DIR=$(pwd)
echo -e "${GREEN}📁 Directorio actual: $CURRENT_DIR${NC}"
echo ""

# 1. Verificar pre-requisitos
echo -e "${CYAN}1️⃣  Verificando pre-requisitos...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 no está instalado. Instalando...${NC}"
    npm install -g pm2
fi

if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx no está instalado. Instalando...${NC}"
    sudo apt update
    sudo apt install -y nginx
fi

echo -e "${GREEN}   ✅ Pre-requisitos verificados${NC}"
echo ""

# 2. Configurar variables de entorno
echo -e "${CYAN}2️⃣  Configurando variables de entorno...${NC}"

ENV_FILE=".env.local"

# Crear .env.local si no existe
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}   📄 Creando $ENV_FILE...${NC}"
    touch "$ENV_FILE"
fi

# Configurar DB_MODE si no existe
if ! grep -q "^DB_MODE=" "$ENV_FILE"; then
    echo "DB_MODE=firebase" >> "$ENV_FILE"
    echo -e "${GREEN}   ✅ DB_MODE=firebase agregado${NC}"
else
    # Asegurar que DB_MODE es firebase
    sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' "$ENV_FILE"
    echo -e "${GREEN}   ✅ DB_MODE configurado correctamente${NC}"
fi

# Verificar que firebase-service-account.json existe
if [ ! -f "firebase-service-account.json" ]; then
    echo -e "${YELLOW}   ⚠️  firebase-service-account.json no encontrado${NC}"
    echo -e "${YELLOW}      Asegúrate de que el archivo existe${NC}"
else
    echo -e "${GREEN}   ✅ firebase-service-account.json encontrado${NC}"
fi

echo ""

# 3. Instalar dependencias
echo -e "${CYAN}3️⃣  Instalando dependencias...${NC}"

if [ -f "package-lock.json" ]; then
    npm ci --production=false
    echo -e "${GREEN}   ✅ Dependencias instaladas (npm ci)${NC}"
else
    npm install
    echo -e "${GREEN}   ✅ Dependencias instaladas (npm install)${NC}"
fi

echo ""

# 4. Crear build de producción
echo -e "${CYAN}4️⃣  Creando build de producción...${NC}"

# Limpiar build anterior
if [ -d ".next" ]; then
    rm -rf .next
    echo -e "${YELLOW}   🧹 Build anterior eliminado${NC}"
fi

# Crear nuevo build
export NODE_ENV=production
if npm run build; then
    echo -e "${GREEN}   ✅ Build completado exitosamente${NC}"
    
    # Verificar que el servidor standalone existe
    if [ -f ".next/standalone/server.js" ]; then
        echo -e "${GREEN}   ✅ Servidor standalone generado correctamente${NC}"
        
        # Copiar archivos necesarios al directorio standalone
        echo -e "${YELLOW}   📋 Copiando archivos necesarios al build standalone...${NC}"
        
        # Copiar firebase-service-account.json si existe
        if [ -f "firebase-service-account.json" ]; then
            cp firebase-service-account.json .next/standalone/ 2>/dev/null || true
            echo -e "${GREEN}   ✅ firebase-service-account.json copiado${NC}"
        fi
        
        # Copiar .env.local al directorio standalone
        if [ -f ".env.local" ]; then
            cp .env.local .next/standalone/ 2>/dev/null || true
            echo -e "${GREEN}   ✅ .env.local copiado${NC}"
        fi
        
        # Copiar directorio public si existe
        if [ -d "public" ]; then
            cp -r public .next/standalone/ 2>/dev/null || true
            echo -e "${GREEN}   ✅ Directorio public copiado${NC}"
        fi
        
        echo -e "${GREEN}   ✅ Build standalone listo${NC}"
    else
        echo -e "${RED}   ❌ Error: Servidor standalone no encontrado${NC}"
        echo -e "${YELLOW}   Verifica la configuración de next.config.js${NC}"
        exit 1
    fi
else
    echo -e "${RED}   ❌ Error en el build${NC}"
    echo -e "${YELLOW}   Ver logs para más detalles${NC}"
    exit 1
fi

echo ""

# 5. Crear directorio de logs
echo -e "${CYAN}5️⃣  Preparando directorio de logs...${NC}"
mkdir -p logs
echo -e "${GREEN}   ✅ Directorio de logs creado${NC}"
echo ""

# 6. Gestionar aplicación con PM2
echo -e "${CYAN}6️⃣  Gestionando aplicación con PM2...${NC}"

# Detener aplicación si está corriendo
if pm2 list | grep -q "$PM2_APP_NAME"; then
    echo -e "${YELLOW}   🔄 Deteniendo aplicación anterior...${NC}"
    pm2 delete "$PM2_APP_NAME" || true
    sleep 2
fi

# Verificar que el servidor standalone existe antes de iniciar
if [ ! -f ".next/standalone/server.js" ]; then
    echo -e "${RED}   ❌ Error: Servidor standalone no encontrado${NC}"
    echo -e "${YELLOW}   Ejecuta 'npm run build' primero${NC}"
    exit 1
fi

# Iniciar aplicación con PM2 usando ecosystem.config.js
echo -e "${YELLOW}   ▶️  Iniciando aplicación...${NC}"
if pm2 start ecosystem.config.js; then
    echo -e "${GREEN}   ✅ Aplicación iniciada con PM2${NC}"
else
    echo -e "${RED}   ❌ Error al iniciar con ecosystem.config.js${NC}"
    exit 1
fi

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para iniciar al arranque del sistema
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

echo ""

# 7. Esperar y verificar que la aplicación funciona
echo -e "${CYAN}7️⃣  Verificando que la aplicación funciona...${NC}"

# Esperar unos segundos para que inicie
sleep 5

# Verificar estado
if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
    echo -e "${GREEN}   ✅ Aplicación está online${NC}"
    
    # Probar conexión local
    if curl -f http://localhost:$PORT > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Aplicación responde en el puerto $PORT${NC}"
    else
        echo -e "${YELLOW}   ⚠️  La aplicación no responde en el puerto $PORT${NC}"
        echo -e "${YELLOW}      Verifica los logs: pm2 logs $PM2_APP_NAME${NC}"
    fi
else
    echo -e "${RED}   ❌ Aplicación no está online${NC}"
    echo -e "${YELLOW}   📋 Ver logs: pm2 logs $PM2_APP_NAME --lines 50${NC}"
fi

echo ""

# 8. Configurar Nginx
echo -e "${CYAN}8️⃣  Configurando Nginx para ${DOMAIN}...${NC}"
    
    # Ejecutar script de configuración de Nginx
if [ -f "deploy/ovh/configure-nginx.sh" ]; then
    bash deploy/ovh/configure-nginx.sh "$DOMAIN"
    echo -e "${GREEN}   ✅ Nginx configurado${NC}"
    else
    echo -e "${YELLOW}   ⚠️  Script de configuración de Nginx no encontrado${NC}"
    echo -e "${YELLOW}      Configurando Nginx manualmente...${NC}"
    
    NGINX_CONFIG="/etc/nginx/sites-available/$PM2_APP_NAME"
    
    sudo tee "$NGINX_CONFIG" > /dev/null <<EOF
# Configuración de Nginx para Arándano Café Bar
# Dominio: $DOMAIN

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Logs
    access_log /var/log/nginx/${PM2_APP_NAME}-access.log;
    error_log /var/log/nginx/${PM2_APP_NAME}-error.log;

    # Configuración para Next.js - Reverse Proxy al puerto 3000
    location / {
        proxy_pass http://localhost:${PORT};
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
        proxy_pass http://localhost:${PORT};
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }

    # Cache para imágenes
    location /images {
        proxy_pass http://localhost:${PORT};
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, immutable";
    }

    # Seguridad adicional
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

    # Habilitar sitio
    sudo ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/
    
    # Eliminar configuración por defecto si existe
    if [ -f /etc/nginx/sites-enabled/default ]; then
        sudo rm /etc/nginx/sites-enabled/default
    fi
    
    # Verificar y recargar Nginx
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo -e "${GREEN}   ✅ Nginx configurado y recargado${NC}"
    else
        echo -e "${RED}   ❌ Error en la configuración de Nginx${NC}"
        fi
fi

        echo ""

# Resumen final
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DESPLIEGUE COMPLETADO${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📊 Estado de PM2:${NC}"
pm2 status
echo ""
echo -e "${CYAN}🌐 Configuración del dominio:${NC}"
echo "   - Dominio: ${GREEN}${DOMAIN}${NC}"
echo "   - Puerto:  ${GREEN}${PORT}${NC}"
echo "   - Nginx:   ${GREEN}Configurado${NC}"
echo ""
echo -e "${CYAN}📋 Comandos útiles:${NC}"
echo "   - Ver logs:        ${GREEN}pm2 logs $PM2_APP_NAME${NC}"
echo "   - Ver logs en vivo: ${GREEN}pm2 logs $PM2_APP_NAME --lines 50 --raw${NC}"
echo "   - Ver estado:      ${GREEN}pm2 status${NC}"
echo "   - Reiniciar:       ${GREEN}pm2 restart $PM2_APP_NAME${NC}"
echo "   - Monitoreo:       ${GREEN}pm2 monit${NC}"
echo ""
echo -e "${CYAN}🔍 Verificar aplicación:${NC}"
echo "   - Local:           ${GREEN}curl http://localhost:$PORT${NC}"
echo "   - Nginx status:    ${GREEN}sudo systemctl status nginx${NC}"
echo "   - Nginx logs:      ${GREEN}sudo tail -f /var/log/nginx/${PM2_APP_NAME}-error.log${NC}"
echo ""
echo -e "${CYAN}🔐 Configurar SSL (opcional):${NC}"
echo "   - Instalar Certbot: ${GREEN}sudo apt install -y certbot python3-certbot-nginx${NC}"
echo "   - Obtener certificado: ${GREEN}sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN${NC}"
echo ""
