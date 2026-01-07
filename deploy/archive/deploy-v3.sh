#!/bin/bash

# Script de Despliegue - Versión 3
# Arándano Café Bar

set -e  # Salir si hay algún error

echo "🚀 Iniciando despliegue - Versión 3"
echo "===================================="

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: No se encontró package.json${NC}"
    echo "Asegúrate de estar en el directorio del proyecto"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js encontrado: $(node --version)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm encontrado: $(npm --version)${NC}"

# Verificar variables de entorno críticas
echo ""
echo "🔍 Verificando variables de entorno..."

if [ -z "$DB_MODE" ]; then
    echo -e "${YELLOW}⚠️  DB_MODE no está configurado, usando 'firebase' por defecto${NC}"
    export DB_MODE=firebase
fi

if [ "$DB_MODE" != "firebase" ]; then
    echo -e "${YELLOW}⚠️  DB_MODE está en '$DB_MODE', se recomienda 'firebase' para producción${NC}"
fi

if [ -z "$FIREBASE_SERVICE_ACCOUNT" ] && [ "$DB_MODE" = "firebase" ]; then
    echo -e "${RED}❌ Error: FIREBASE_SERVICE_ACCOUNT no está configurado${NC}"
    echo "Configura esta variable antes de continuar"
    exit 1
fi

echo -e "${GREEN}✓ Variables de entorno verificadas${NC}"

# Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install --production=false

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al instalar dependencias${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# Verificar Firebase (si está configurado)
if [ "$DB_MODE" = "firebase" ]; then
    echo ""
    echo "🔥 Verificando conexión a Firebase..."
    
    if npm run test:firebase 2>/dev/null; then
        echo -e "${GREEN}✓ Firebase conectado correctamente${NC}"
    else
        echo -e "${YELLOW}⚠️  No se pudo verificar Firebase, continuando de todas formas...${NC}"
    fi
fi

# Limpiar build anterior
echo ""
echo "🧹 Limpiando build anterior..."
rm -rf .next
echo -e "${GREEN}✓ Build anterior limpiado${NC}"

# Crear build
echo ""
echo "🔨 Creando build de producción..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al crear el build${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build creado exitosamente${NC}"

# Verificar PM2
if command -v pm2 &> /dev/null; then
    echo ""
    echo "🔄 Reiniciando aplicación con PM2..."
    
    # Verificar si la app ya está corriendo
    if pm2 list | grep -q "arandano-app"; then
        pm2 restart arandano-app
        echo -e "${GREEN}✓ Aplicación reiniciada${NC}"
    else
        pm2 start npm --name "arandano-app" -- start
        pm2 save
        echo -e "${GREEN}✓ Aplicación iniciada${NC}"
    fi
    
    # Mostrar estado
    echo ""
    echo "📊 Estado de PM2:"
    pm2 status
    
    echo ""
    echo "📋 Últimas líneas de logs:"
    pm2 logs arandano-app --lines 10 --nostream
else
    echo ""
    echo -e "${YELLOW}⚠️  PM2 no está instalado${NC}"
    echo "Para iniciar la aplicación manualmente, ejecuta:"
    echo "  npm start"
fi

echo ""
echo -e "${GREEN}✅ Despliegue completado exitosamente!${NC}"
echo ""
echo "🔍 Para verificar:"
echo "  - Ver logs: pm2 logs arandano-app"
echo "  - Ver estado: pm2 status"
echo "  - Verificar aplicación: curl http://localhost:3000"
echo ""

