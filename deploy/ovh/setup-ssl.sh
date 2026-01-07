#!/bin/bash

###############################################################################
# Configuración de SSL/HTTPS con Let's Encrypt para OVH
# Arándano Café Bar
# 
# Uso: bash deploy/ovh/setup-ssl.sh [dominio]
###############################################################################

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="${1:-arandanocafe.com}"
EMAIL="${2:-admin@${DOMAIN}}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔒 CONFIGURACIÓN DE SSL/HTTPS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verificar que Certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}⚠️  Certbot no está instalado. Instalando...${NC}"
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Verificar que Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx no está instalado${NC}"
    exit 1
fi

# Obtener certificado
echo -e "${BLUE}🔐 Obteniendo certificado SSL para $DOMAIN...${NC}"
echo ""

sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Certificado SSL obtenido exitosamente${NC}"
    echo ""
    echo -e "${CYAN}📝 Certbot configurará automáticamente Nginx para usar HTTPS${NC}"
    echo ""
    echo -e "${CYAN}🔄 Renovación automática:${NC}"
    echo "   Certbot configura automáticamente renovaciones con cron"
    echo "   Verificar: ${GREEN}sudo certbot renew --dry-run${NC}"
    echo ""
else
    echo -e "${RED}❌ Error obteniendo certificado${NC}"
    exit 1
fi

