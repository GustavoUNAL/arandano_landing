#!/bin/bash

###############################################################################
# Script de Reconstrucción Rápida
# Arándano Café Bar - arandanocafe.com
# 
# Este script reconstruye la aplicación y la reinicia
# Uso: bash deploy/ovh/rebuild.sh
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
PORT=3000

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔨 RECONSTRUCCIÓN RÁPIDA${NC}"
echo -e "${BLUE}  Arándano Café Bar - ${DOMAIN}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Detectar directorio del proyecto automáticamente
PROJECT_DIR=""
if [ -f "package.json" ]; then
    PROJECT_DIR=$(pwd)
elif [ -d "${HOME}/projects/arandano_landing" ]; then
    PROJECT_DIR="${HOME}/projects/arandano_landing"
elif [ -d "${HOME}/arandano" ]; then
    PROJECT_DIR="${HOME}/arandano"
elif [ -d "/home/ubuntu/projects/arandano_landing" ]; then
    PROJECT_DIR="/home/ubuntu/projects/arandano_landing"
elif [ -d "/home/ubuntu/arandano" ]; then
    PROJECT_DIR="/home/ubuntu/arandano"
fi

# Cambiar al directorio del proyecto
if [ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    echo -e "${GREEN}📁 Directorio: $PROJECT_DIR${NC}"
else
    echo -e "${RED}❌ No se encontró el directorio del proyecto${NC}"
    exit 1
fi

# Verificar que package.json existe
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ No se encontró package.json${NC}"
    exit 1
fi

echo ""

# 1. Detener aplicación PM2
echo -e "${CYAN}1️⃣  Deteniendo aplicación...${NC}"
if pm2 list | grep -q "$PM2_APP_NAME"; then
    pm2 delete "$PM2_APP_NAME" || true
    echo -e "${GREEN}   ✅ Aplicación detenida${NC}"
else
    echo -e "${YELLOW}   ⚠️  Aplicación no estaba corriendo${NC}"
fi
echo ""

# 2. Limpiar build anterior
echo -e "${CYAN}2️⃣  Limpiando build anterior...${NC}"
if [ -d ".next" ]; then
    rm -rf .next
    echo -e "${GREEN}   ✅ Build anterior eliminado${NC}"
else
    echo -e "${YELLOW}   ⚠️  No había build anterior${NC}"
fi
echo ""

# 3. Instalar dependencias (si es necesario)
echo -e "${CYAN}3️⃣  Verificando dependencias...${NC}"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "${YELLOW}   📦 Instalando dependencias...${NC}"
    if [ -f "package-lock.json" ]; then
        npm ci --production=false
    else
        npm install
    fi
    echo -e "${GREEN}   ✅ Dependencias instaladas${NC}"
else
    echo -e "${GREEN}   ✅ Dependencias actualizadas${NC}"
fi
echo ""

# 4. Crear build de producción
echo -e "${CYAN}4️⃣  Creando build de producción...${NC}"
export NODE_ENV=production

if npm run build; then
    echo -e "${GREEN}   ✅ Build completado${NC}"
    
    # Verificar que el servidor standalone existe
    if [ ! -f ".next/standalone/server.js" ]; then
        echo -e "${RED}   ❌ Error: Servidor standalone no encontrado${NC}"
        exit 1
    fi
    
    # Copiar archivos necesarios para standalone mode
    if [ -d ".next/static" ]; then
        mkdir -p .next/standalone/.next
        cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
    fi
    
    if [ -d "public" ]; then
        cp -r public .next/standalone/ 2>/dev/null || true
    fi
    
    if [ -f "firebase-service-account.json" ]; then
        cp firebase-service-account.json .next/standalone/ 2>/dev/null || true
    fi
    
    if [ -f ".env.local" ]; then
        cp .env.local .next/standalone/ 2>/dev/null || true
    fi
    
    echo -e "${GREEN}   ✅ Archivos copiados al build standalone${NC}"
else
    echo -e "${RED}   ❌ Error en el build${NC}"
    exit 1
fi
echo ""

# 5. Crear directorio de logs
mkdir -p logs

# 6. Iniciar aplicación con PM2
echo -e "${CYAN}5️⃣  Iniciando aplicación con PM2...${NC}"
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
else
    # Método alternativo
    pm2 start .next/standalone/server.js --name "$PM2_APP_NAME" \
        --cwd "$(pwd)" \
        --env-file .env.local \
        --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
        --error ./logs/pm2-error.log \
        --output ./logs/pm2-out.log \
        --merge-logs \
        --max-memory-restart 500M \
        --instances 1 \
        --exec-mode fork \
        --autorestart \
        --update-env \
        --env NODE_ENV=production \
        --env PORT=$PORT
fi

pm2 save
echo -e "${GREEN}   ✅ Aplicación iniciada${NC}"
echo ""

# 7. Verificar que la aplicación funciona
echo -e "${CYAN}6️⃣  Verificando aplicación...${NC}"
sleep 5

if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
    echo -e "${GREEN}   ✅ Aplicación está online${NC}"
    
    if curl -f http://localhost:$PORT > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Aplicación responde en puerto $PORT${NC}"
    else
        echo -e "${YELLOW}   ⚠️  La aplicación no responde aún${NC}"
        echo -e "${YELLOW}      Verifica logs: pm2 logs $PM2_APP_NAME${NC}"
    fi
else
    echo -e "${RED}   ❌ Aplicación no está online${NC}"
    echo -e "${YELLOW}   📋 Ver logs: pm2 logs $PM2_APP_NAME --lines 50${NC}"
fi
echo ""

# 8. Verificar/Configurar Nginx
if command -v nginx &> /dev/null; then
    echo -e "${CYAN}7️⃣  Verificando Nginx...${NC}"
    
    NGINX_CONFIG="/etc/nginx/sites-available/$PM2_APP_NAME"
    
    if [ ! -f "$NGINX_CONFIG" ]; then
        echo -e "${YELLOW}   ⚠️  Configuración de Nginx no encontrada${NC}"
        echo -e "${YELLOW}      Configurando Nginx para $DOMAIN...${NC}"
        bash deploy/ovh/configure-nginx.sh "$DOMAIN" || true
    else
        # Verificar que el dominio está configurado
        if grep -q "$DOMAIN" "$NGINX_CONFIG"; then
            echo -e "${GREEN}   ✅ Nginx configurado para $DOMAIN${NC}"
            
            # Verificar y recargar
            if sudo nginx -t; then
                sudo systemctl reload nginx
                echo -e "${GREEN}   ✅ Nginx recargado${NC}"
            else
                echo -e "${RED}   ❌ Error en configuración de Nginx${NC}"
            fi
        else
            echo -e "${YELLOW}   ⚠️  Dominio no configurado en Nginx${NC}"
            echo -e "${YELLOW}      Reconfigurando...${NC}"
            bash deploy/ovh/configure-nginx.sh "$DOMAIN" || true
        fi
    fi
    echo ""
fi

# Resumen final
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ RECONSTRUCCIÓN COMPLETADA${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📊 Estado de PM2:${NC}"
pm2 status
echo ""
echo -e "${CYAN}📋 Comandos útiles:${NC}"
echo "   - Ver logs:        ${GREEN}pm2 logs $PM2_APP_NAME${NC}"
echo "   - Ver estado:      ${GREEN}pm2 status${NC}"
echo "   - Reiniciar:       ${GREEN}pm2 restart $PM2_APP_NAME${NC}"
echo ""
echo -e "${CYAN}🔍 Verificar aplicación:${NC}"
echo "   - Local:           ${GREEN}curl http://localhost:$PORT${NC}"
if command -v nginx &> /dev/null; then
    echo "   - Dominio:         ${GREEN}curl http://$DOMAIN${NC}"
fi
echo ""

