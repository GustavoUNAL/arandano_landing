#!/bin/bash

# Script para configurar HTTPS con Let's Encrypt para arandanocafe.com
# Ejecutar en el servidor: bash setup-https.sh

set -e

DOMAIN="arandanocafe.com"
NGINX_CONFIG="/etc/nginx/sites-available/arandano"

echo "🔒 Configurando HTTPS para $DOMAIN..."
echo ""

# Verificar que estamos en el servidor correcto
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ No se encontró la configuración de Nginx en $NGINX_CONFIG"
    echo "Por favor, crea primero la configuración de Nginx."
    exit 1
fi

# Paso 1: Actualizar configuración de Nginx con el dominio correcto
echo "📝 Actualizando configuración de Nginx con el dominio $DOMAIN..."

# Crear backup de la configuración actual
sudo cp $NGINX_CONFIG ${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)

# Actualizar server_name en la configuración
sudo sed -i "s/server_name _;/server_name $DOMAIN www.$DOMAIN;/g" $NGINX_CONFIG
sudo sed -i "s/server_name tu-dominio.com www.tu-dominio.com;/server_name $DOMAIN www.$DOMAIN;/g" $NGINX_CONFIG

# Verificar que el cambio se aplicó
if grep -q "server_name $DOMAIN" $NGINX_CONFIG; then
    echo "✅ Configuración de Nginx actualizada"
else
    echo "⚠️  Verifica manualmente que server_name esté configurado correctamente"
fi

# Verificar configuración de Nginx
echo ""
echo "🔍 Verificando configuración de Nginx..."
if sudo nginx -t; then
    echo "✅ Configuración de Nginx válida"
    sudo systemctl reload nginx
else
    echo "❌ Error en la configuración de Nginx"
    echo "Restaurando backup..."
    sudo cp ${NGINX_CONFIG}.backup.* $NGINX_CONFIG
    exit 1
fi

# Paso 2: Instalar Certbot si no está instalado
echo ""
echo "📦 Verificando Certbot..."
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
    echo "✅ Certbot instalado"
else
    echo "✅ Certbot ya está instalado"
fi

# Paso 3: Obtener certificado SSL
echo ""
echo "🔐 Obteniendo certificado SSL de Let's Encrypt..."
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de que:"
echo "   1. El dominio $DOMAIN apunta a esta IP: $(curl -s ifconfig.me)"
echo "   2. Los puertos 80 y 443 están abiertos en Security Groups de AWS"
echo "   3. Nginx está corriendo y accesible desde internet"
echo ""
read -p "Presiona Enter cuando estés listo para continuar..."

# Ejecutar certbot
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

echo ""
echo "✅ ¡HTTPS configurado correctamente!"
echo ""
echo "🌐 Tu sitio debería estar disponible en:"
echo "   - https://$DOMAIN"
echo "   - https://www.$DOMAIN"
echo ""
echo "📋 Verificar certificado:"
echo "   sudo certbot certificates"
echo ""
echo "🔄 Verificar renovación automática:"
echo "   sudo certbot renew --dry-run"
echo ""

