# 🚀 Guía Completa de Despliegue en EC2

Esta guía te ayudará a desplegar la aplicación Arándano Café Bar en EC2 con el dominio **arandanocafe.com** usando el nuevo sistema standalone.

## 📋 Prerrequisitos

1. Instancia EC2 corriendo (Ubuntu 20.04 o superior)
2. Acceso SSH a la instancia
3. Dominio arandanocafe.com apuntando a la IP de EC2
4. Security Groups configurados para permitir puertos 22, 80, 443

## 🔧 Pasos para Desplegar

### 1. Conectarse al Servidor EC2

```bash
ssh -i tu-clave.pem ubuntu@tu-ip-ec2
```

### 2. Clonar o Subir el Proyecto

**Opción A: Si usas Git**
```bash
cd ~
git clone tu-repositorio projects/arandano_landing
cd projects/arandano_landing
```

**Opción B: Subir archivos con SCP (desde tu máquina local)**
```bash
# Desde tu máquina local
scp -r -i tu-clave.pem ./ARANDANO ubuntu@tu-ip-ec2:~/projects/arandano_landing
```

### 3. Subir Archivos de Configuración

Desde tu máquina local, sube los archivos necesarios:

```bash
# Subir .env.local
scp -i tu-clave.pem .env.local ubuntu@tu-ip-ec2:~/projects/arandano_landing/

# Subir firebase-service-account.json
scp -i tu-clave.pem firebase-service-account.json ubuntu@tu-ip-ec2:~/projects/arandano_landing/
```

### 4. Ejecutar el Script de Despliegue

En el servidor EC2:

```bash
cd ~/projects/arandano_landing
bash deploy-ec2.sh
```

Este script automáticamente:
- ✅ Verifica que Node.js, PM2 y Nginx estén instalados
- ✅ Configura variables de entorno
- ✅ Instala dependencias
- ✅ Crea el build de producción (standalone)
- ✅ Copia archivos necesarios al build standalone
- ✅ Configura y inicia PM2 con ecosystem.config.js
- ✅ Configura Nginx con el dominio arandanocafe.com
- ✅ Verifica que todo funcione correctamente

### 5. Verificar el Despliegue

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

### 6. Configurar SSL (Opcional pero Recomendado)

Para habilitar HTTPS:

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d arandanocafe.com -d www.arandanocafe.com

# Certbot configurará automáticamente HTTPS y redirección HTTP -> HTTPS
```

## 🔄 Actualizar la Aplicación

Para actualizar la aplicación después de hacer cambios:

```bash
# 1. Hacer pull de los cambios (si usas git)
cd ~/projects/arandano_landing
git pull

# 2. Ejecutar el script de despliegue completo
bash deploy-ec2.sh
```

El script automáticamente:
- Limpia el build anterior
- Crea un nuevo build
- Reinicia la aplicación con PM2
- Recarga Nginx

## 🔍 Solución de Problemas

### Error: "Could not find a production build"

Este error ocurre cuando no se ha ejecutado el build. Solución:

```bash
# Ejecutar el script completo de despliegue
bash deploy-ec2.sh
```

### Error: "next start does not work with output: standalone"

Este error ya está resuelto. El script usa `ecosystem.config.js` que está configurado para usar el servidor standalone correctamente.

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

### Problemas con Firebase

1. Verificar que firebase-service-account.json existe:
   ```bash
   ls -la firebase-service-account.json
   ```

2. Verificar que está copiado en el build standalone:
   ```bash
   ls -la .next/standalone/firebase-service-account.json
   ```

3. Verificar variables de entorno:
   ```bash
   cat .env.local | grep DB_MODE
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

# Ver logs de Nginx
sudo tail -f /var/log/nginx/arandano-app-error.log
```

## 🔐 Configuración de Seguridad

### Firewall (UFW)

```bash
# Instalar UFW si no está instalado
sudo apt install -y ufw

# Permitir SSH, HTTP y HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Ver estado
sudo ufw status
```

### Security Groups en AWS

Asegúrate de que los Security Groups en AWS permitan:
- Puerto 22 (SSH) desde tu IP
- Puerto 80 (HTTP) desde cualquier lugar (0.0.0.0/0)
- Puerto 443 (HTTPS) desde cualquier lugar (0.0.0.0/0)

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `pm2 logs arandano-app`
2. Verifica la configuración: `pm2 info arandano-app`
3. Revisa los logs de Nginx: `sudo tail -f /var/log/nginx/arandano-app-error.log`
4. Verifica el build: `ls -la .next/standalone/server.js`

## ✅ Checklist Final

- [ ] Node.js instalado (v18 o superior)
- [ ] PM2 instalado y configurado
- [ ] Nginx instalado y configurado
- [ ] `.env.local` configurado con DB_MODE=firebase
- [ ] `firebase-service-account.json` presente
- [ ] Build creado exitosamente
- [ ] PM2 corriendo la aplicación
- [ ] Nginx configurado con dominio arandanocafe.com
- [ ] Aplicación responde en http://localhost:3000
- [ ] Nginx proxy funciona correctamente
- [ ] SSL configurado (opcional)

