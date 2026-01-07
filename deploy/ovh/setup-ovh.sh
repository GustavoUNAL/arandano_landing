#!/bin/bash

###############################################################################
# Script de Configuración Inicial para Servidor OVH
# Arándano Café Bar
# 
# Este script configura el servidor desde cero
# Uso: bash deploy/ovh/setup-ovh.sh
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
PROJECT_NAME="arandano-app"
PROJECT_DIR="${HOME}/arandano"
NODE_VERSION="20"  # LTS más reciente
PM2_APP_NAME="arandano-app"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🚀 CONFIGURACIÓN INICIAL - SERVIDOR OVH${NC}"
echo -e "${BLUE}  Arándano Café Bar${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar que estamos en un sistema Ubuntu/Debian
if ! command -v apt-get &> /dev/null; then
    echo -e "${RED}❌ Este script está diseñado para sistemas Ubuntu/Debian${NC}"
    exit 1
fi

# 1. Actualizar sistema
echo -e "${CYAN}1️⃣  Actualizando sistema...${NC}"
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw
echo -e "${GREEN}   ✅ Sistema actualizado${NC}"
echo ""

# 2. Instalar Node.js usando NodeSource
echo -e "${CYAN}2️⃣  Instalando Node.js ${NODE_VERSION}.x (LTS)...${NC}"
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "${NODE_VERSION}" ]; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}   ✅ Node.js instalado: $(node -v)${NC}"
    echo -e "${GREEN}   ✅ npm instalado: $(npm -v)${NC}"
else
    echo -e "${YELLOW}   ⚠️  Node.js ya está instalado: $(node -v)${NC}"
fi
echo ""

# 3. Instalar PM2 globalmente
echo -e "${CYAN}3️⃣  Instalando PM2 (gestor de procesos)...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    pm2 startup systemd -u $USER --hp $HOME
    echo -e "${GREEN}   ✅ PM2 instalado y configurado${NC}"
else
    echo -e "${YELLOW}   ⚠️  PM2 ya está instalado: $(pm2 -v)${NC}"
fi
echo ""

# 4. Instalar Nginx
echo -e "${CYAN}4️⃣  Instalando Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    echo -e "${GREEN}   ✅ Nginx instalado${NC}"
else
    echo -e "${YELLOW}   ⚠️  Nginx ya está instalado${NC}"
fi
echo ""

# 5. Configurar firewall
echo -e "${CYAN}5️⃣  Configurando firewall (UFW)...${NC}"
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw status
echo -e "${GREEN}   ✅ Firewall configurado${NC}"
echo ""

# 6. Crear directorio del proyecto
echo -e "${CYAN}6️⃣  Preparando directorio del proyecto...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p "$PROJECT_DIR"
    echo -e "${GREEN}   ✅ Directorio creado: $PROJECT_DIR${NC}"
else
    echo -e "${YELLOW}   ⚠️  El directorio ya existe: $PROJECT_DIR${NC}"
fi
echo ""

# 7. Crear directorio de logs
echo -e "${CYAN}7️⃣  Creando directorio de logs...${NC}"
mkdir -p "$PROJECT_DIR/logs"
echo -e "${GREEN}   ✅ Directorio de logs creado${NC}"
echo ""

# 8. Instalar herramientas adicionales útiles
echo -e "${CYAN}8️⃣  Instalando herramientas adicionales...${NC}"
sudo apt install -y htop jq nano certbot python3-certbot-nginx
echo -e "${GREEN}   ✅ Herramientas instaladas${NC}"
echo ""

# Resumen
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ CONFIGURACIÓN INICIAL COMPLETADA${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📊 Versiones instaladas:${NC}"
echo "   - Node.js: $(node -v)"
echo "   - npm: $(npm -v)"
echo "   - PM2: $(pm2 -v 2>/dev/null || echo 'No instalado')"
echo "   - Nginx: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo ""
echo -e "${CYAN}📁 Directorio del proyecto:${NC}"
echo "   $PROJECT_DIR"
echo ""
echo -e "${CYAN}📝 Próximos pasos:${NC}"
echo "   1. Clonar o subir el proyecto a: $PROJECT_DIR"
echo "   2. Configurar variables de entorno (.env.local)"
echo "   3. Ejecutar: bash deploy/ovh/deploy.sh"
echo ""
echo -e "${BLUE}💡 Comandos útiles:${NC}"
echo "   - Ver estado de servicios: ${GREEN}systemctl status nginx${NC}"
echo "   - Reiniciar Nginx: ${GREEN}sudo systemctl restart nginx${NC}"
echo "   - Ver logs de PM2: ${GREEN}pm2 logs${NC}"
echo "   - Ver estado de PM2: ${GREEN}pm2 status${NC}"
echo ""

