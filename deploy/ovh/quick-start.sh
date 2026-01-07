#!/bin/bash

###############################################################################
# Inicio Rápido - Despliegue en OVH
# Arándano Café Bar
# 
# Este script ejecuta todos los pasos necesarios para desplegar desde cero
# Uso: bash deploy/ovh/quick-start.sh [dominio] [email]
###############################################################################

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

DOMAIN="${1}"
EMAIL="${2}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  ⚡ INICIO RÁPIDO - DESPLIEGUE OVH${NC}"
echo -e "${BLUE}  Arándano Café Bar${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ No se encontró package.json${NC}"
    echo "   Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Paso 1: Setup inicial
echo -e "${CYAN}1️⃣  Configurando servidor...${NC}"
bash deploy/ovh/setup-ovh.sh

# Verificar si necesita configuración manual
echo ""
read -p "¿Ya tienes firebase-service-account.json y .env.local configurados? (s/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Configura estos archivos antes de continuar:${NC}"
    echo "   1. firebase-service-account.json"
    echo "   2. .env.local"
    echo ""
    echo "   Luego ejecuta: bash deploy/ovh/deploy.sh"
    exit 0
fi

# Paso 2: Desplegar aplicación
echo ""
echo -e "${CYAN}2️⃣  Desplegando aplicación...${NC}"
bash deploy/ovh/deploy.sh

# Paso 3: Configurar Nginx (si se proporciona dominio)
if [ -n "$DOMAIN" ]; then
    echo ""
    echo -e "${CYAN}3️⃣  Configurando Nginx...${NC}"
    bash deploy/ovh/configure-nginx.sh "$DOMAIN"
    
    # Paso 4: Configurar SSL (si se proporciona email)
    if [ -n "$EMAIL" ]; then
        echo ""
        echo -e "${CYAN}4️⃣  Configurando SSL/HTTPS...${NC}"
        bash deploy/ovh/setup-ssl.sh "$DOMAIN" "$EMAIL"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Para configurar SSL más tarde:${NC}"
        echo "   bash deploy/ovh/setup-ssl.sh $DOMAIN tu-email@ejemplo.com"
    fi
else
    echo ""
    echo -e "${YELLOW}⚠️  Para configurar Nginx más tarde:${NC}"
    echo "   bash deploy/ovh/configure-nginx.sh tu-dominio.com"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ DESPLIEGUE COMPLETADO${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📊 Verificar estado:${NC}"
echo "   pm2 status"
echo "   npm run diagnose:firebase"
echo ""

