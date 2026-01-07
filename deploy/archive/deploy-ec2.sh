#!/bin/bash

# Script de despliegue optimizado para EC2 - Arándano Café Bar
# Uso: bash deploy-ec2.sh

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  🚀 DESPLIEGUE EN EC2 - ARÁNDANO CAFÉ BAR"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Detectar directorio del proyecto
PROJECT_DIR="${HOME}/ARANDANO"
if [ ! -d "$PROJECT_DIR" ]; then
    PROJECT_DIR="/home/ubuntu/ARANDANO"
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Directorio del proyecto no encontrado${NC}"
    echo "   Buscado en: ~/ARANDANO y /home/ubuntu/ARANDANO"
    exit 1
fi

echo -e "${GREEN}📁 Directorio: $PROJECT_DIR${NC}"
cd "$PROJECT_DIR"

# Verificar que existe package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json no encontrado${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}📦 Instalando dependencias...${NC}"
npm ci --production=false

echo ""
echo -e "${GREEN}🔨 Creando build de producción...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en el build${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build completado exitosamente${NC}"

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 no está instalado${NC}"
    echo "   Instalando PM2..."
    sudo npm install -g pm2
fi

echo ""
echo -e "${GREEN}🔄 Reiniciando aplicación con PM2...${NC}"

# Detener si ya existe
pm2 delete arandano-app 2>/dev/null || true

# Iniciar aplicación
pm2 start npm --name "arandano-app" -- start

# Guardar configuración
pm2 save

echo ""
echo -e "${GREEN}✅ Aplicación desplegada${NC}"
echo ""
echo "📊 Estado:"
pm2 status

echo ""
echo "📋 Comandos útiles:"
echo "  pm2 logs arandano-app    - Ver logs"
echo "  pm2 restart arandano-app - Reiniciar"
echo "  pm2 monit                - Monitor de recursos"
echo ""
echo "═══════════════════════════════════════════════════════════"

