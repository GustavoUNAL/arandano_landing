# ✅ Checklist de Configuración EC2

## Antes de Desplegar

### En tu Máquina Local

- [x] Build compila sin errores: `npm run build`
- [x] Firebase configurado y datos migrados
- [x] Variables de entorno documentadas
- [x] Scripts de backup creados

### En el Servidor EC2

#### 1. Instalación Base
- [ ] Node.js 18.x instalado
- [ ] PM2 instalado globalmente
- [ ] Nginx instalado y configurado
- [ ] Firewall configurado (puertos 22, 80, 443)

#### 2. Proyecto
- [ ] Proyecto clonado/subido a EC2
- [ ] `.env.local` creado con todas las variables
- [ ] `firebase-service-account.json` subido (o variable de entorno)
- [ ] Dependencias instaladas: `npm install`
- [ ] Build creado: `npm run build`

#### 3. PM2
- [ ] Aplicación iniciada con PM2
- [ ] PM2 configurado para iniciar al arrancar
- [ ] Logs verificados: `pm2 logs arandano-app`

#### 4. Nginx
- [ ] Configuración creada en `/etc/nginx/sites-available/arandano`
- [ ] Sitio habilitado: `ln -s` a `sites-enabled`
- [ ] Configuración verificada: `nginx -t`
- [ ] Nginx reiniciado y funcionando

#### 5. SSL (Opcional pero Recomendado)
- [ ] Certbot instalado
- [ ] Certificado SSL obtenido
- [ ] Renovación automática configurada

#### 6. Verificación
- [ ] Aplicación responde en `http://tu-ip:3000`
- [ ] Nginx proxy funciona correctamente
- [ ] Firebase conecta desde el servidor
- [ ] Todas las rutas funcionan

## Comandos Rápidos

```bash
# Desplegar
bash deploy-ec2.sh

# Ver estado
pm2 status
pm2 logs arandano-app

# Reiniciar
pm2 restart arandano-app

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

