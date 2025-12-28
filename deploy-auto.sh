#!/bin/bash

# Script de despliegue automático para Arándano Café Bar
# Usado por GitHub Actions - NO INTERACTIVO

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Desplegando Arándano Café Bar...${NC}"
echo ""

# Detectar directorio del proyecto
if [ -d "$HOME/projects/arandano_landing" ]; then
    PROJECT_DIR="$HOME/projects/arandano_landing"
elif [ -d "$HOME/ARANDANO" ]; then
    PROJECT_DIR="$HOME/ARANDANO"
elif [ -d "/home/ubuntu/ARANDANO" ]; then
    PROJECT_DIR="/home/ubuntu/ARANDANO"
elif [ -d "/home/ubuntu/projects/arandano_landing" ]; then
    PROJECT_DIR="/home/ubuntu/projects/arandano_landing"
else
    echo -e "${RED}❌ No se encontró el directorio del proyecto${NC}"
    exit 1
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Directorio no encontrado: $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}📁 Directorio: $PROJECT_DIR${NC}"
echo ""

# Hacer pull de Git (no interactivo)
if [ -d ".git" ]; then
    echo -e "${GREEN}📥 Haciendo pull...${NC}"
    git fetch origin
    git reset --hard origin/main || git reset --hard origin/master
    echo ""
fi

# Instalar dependencias
echo -e "${GREEN}📦 Instalando dependencias...${NC}"
npm ci --production=false
echo ""

# Crear build
echo -e "${GREEN}🔨 Creando build de producción...${NC}"
npm run build
echo ""

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 no está instalado. Instalando...${NC}"
    sudo npm install -g pm2
    echo ""
fi

# Reiniciar aplicación con PM2
echo -e "${GREEN}🔄 Reiniciando aplicación...${NC}"

# Verificar si la app ya está corriendo
if pm2 list | grep -q "arandano-app"; then
    pm2 restart arandano-app
    echo -e "${GREEN}✅ Aplicación reiniciada${NC}"
else
    pm2 start npm --name "arandano-app" -- start
    pm2 startup 2>/dev/null || true
    pm2 save
    echo -e "${GREEN}✅ Aplicación iniciada${NC}"
fi

echo ""
echo -e "${GREEN}✅ Despliegue completado!${NC}"
echo ""
pm2 status arandano-app

