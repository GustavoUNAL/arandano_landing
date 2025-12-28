#!/bin/bash

# Script de despliegue rápido para Arándano Café Bar
# Ejecutar en el servidor EC2: bash deploy.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Desplegando Arándano Café Bar...${NC}"
echo ""

# Detectar directorio del proyecto
if [ -d "$HOME/ARANDANO" ]; then
    PROJECT_DIR="$HOME/ARANDANO"
elif [ -d "/home/ubuntu/ARANDANO" ]; then
    PROJECT_DIR="/home/ubuntu/ARANDANO"
else
    read -p "Ingresa la ruta del proyecto: " PROJECT_DIR
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Directorio no encontrado: $PROJECT_DIR${NC}"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}📁 Directorio: $PROJECT_DIR${NC}"
echo ""

# Verificar si hay cambios en Git (opcional)
if [ -d ".git" ]; then
    read -p "¿Deseas hacer pull de Git? (y/n): " GIT_PULL
    if [ "$GIT_PULL" = "y" ] || [ "$GIT_PULL" = "Y" ]; then
        echo -e "${GREEN}📥 Haciendo pull...${NC}"
        git pull origin main || git pull origin master
        echo ""
    fi
fi

# Instalar dependencias
echo -e "${GREEN}📦 Instalando dependencias...${NC}"
npm install
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
echo "📊 Estado de la aplicación:"
pm2 status arandano-app
echo ""
echo "📋 Comandos útiles:"
echo "   - Ver logs: pm2 logs arandano-app"
echo "   - Ver estado: pm2 status"
echo "   - Reiniciar: pm2 restart arandano-app"
echo ""
echo "🌐 Tu aplicación debería estar disponible en:"
echo "   - http://localhost:3000 (directo)"
echo "   - http://tu-dominio.com (si Nginx está configurado)"

