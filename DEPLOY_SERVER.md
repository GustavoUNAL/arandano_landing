# 🚀 Guía de Despliegue en el Servidor

Esta guía te ayudará a desplegar la aplicación Arándano Café Bar en el servidor con el dominio **arandanocafe.com**.

## 📋 Prerrequisitos

1. Acceso SSH al servidor
2. Node.js instalado (v18 o superior)
3. PM2 instalado globalmente
4. Nginx instalado

## 🔧 Pasos para Desplegar

### 1. Conectarse al Servidor

```bash
ssh ubuntu@tu-servidor
cd ~/projects/arandano_landing
```

### 2. Ejecutar el Script de Despliegue Completo

El script `full-deploy.sh` realiza todo el proceso automáticamente:

```bash
bash deploy/ovh/full-deploy.sh
```

Este script:
- ✅ Verifica pre-requisitos
- ✅ Configura variables de entorno
- ✅ Instala dependencias
- ✅ Crea el build de producción
- ✅ Copia archivos necesarios al build standalone
- ✅ Configura y inicia PM2
- ✅ Configura Nginx con el dominio arandanocafe.com
- ✅ Verifica que todo funcione correctamente

### 3. Verificar el Despliegue

Después de ejecutar el script, verifica que todo esté funcionando:

```bash
# Ver estado de PM2
pm2 status

# Ver logs de la aplicación
pm2 logs arandano-app --lines 50

# Verificar que la aplicación responde localmente
curl http://localhost:3000

# Verificar estado de Nginx
sudo systemctl status nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/arandano-app-error.log
```

### 4. Configurar SSL (Opcional pero Recomendado)

Para habilitar HTTPS:

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d arandanocafe.com -d www.arandanocafe.com

# Certbot configurará automáticamente HTTPS y redirección HTTP -> HTTPS
```

## 🔍 Solución de Problemas

### Error: "Could not find a production build"

Este error ocurre cuando no se ha ejecutado el build. Solución:

```bash
# Ejecutar el script completo de despliegue
bash deploy/ovh/full-deploy.sh
```

### Error: "next start does not work with output: standalone"

Este error ocurre cuando se intenta usar `next start` con modo standalone. El script `full-deploy.sh` ya está configurado para usar el servidor standalone correctamente.

### La aplicación no responde

1. Verificar que PM2 está corriendo:
   ```bash
   pm2 status
   ```

2. Ver logs de errores:
   ```bash
   pm2 logs arandano-app --err
   ```

3. Verificar que el puerto 3000 está en uso:
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

4. Reiniciar la aplicación:
   ```bash
   pm2 restart arandano-app
   ```

### Nginx no funciona

1. Verificar configuración de Nginx:
   ```bash
   sudo nginx -t
   ```

2. Ver logs de Nginx:
   ```bash
   sudo tail -f /var/log/nginx/arandano-app-error.log
   ```

3. Recargar Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## 📝 Comandos Útiles

```bash
# Ver estado de PM2
pm2 status

# Ver logs en tiempo real
pm2 logs arandano-app

# Reiniciar aplicación
pm2 restart arandano-app

# Detener aplicación
pm2 stop arandano-app

# Eliminar aplicación de PM2
pm2 delete arandano-app

# Ver monitoreo
pm2 monit

# Guardar configuración de PM2
pm2 save

# Verificar que la aplicación responde
curl http://localhost:3000

# Ver estado de Nginx
sudo systemctl status nginx

# Recargar Nginx
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔄 Actualizar la Aplicación

Para actualizar la aplicación después de hacer cambios:

```bash
# 1. Hacer pull de los cambios (si usas git)
git pull

# 2. Ejecutar el script de despliegue completo
bash deploy/ovh/full-deploy.sh
```

El script automáticamente:
- Limpia el build anterior
- Crea un nuevo build
- Reinicia la aplicación con PM2
- Recarga Nginx

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `pm2 logs arandano-app`
2. Verifica la configuración: `pm2 info arandano-app`
3. Revisa los logs de Nginx: `sudo tail -f /var/log/nginx/arandano-app-error.log`

