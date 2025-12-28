# Guía Rápida: Lanzar App en EC2

## Opción 1: Despliegue Rápido (Recomendado)

### Paso 1: Conectarse a tu EC2

```bash
ssh -i tu-clave.pem ubuntu@tu-ip-publica-ec2
```

### Paso 2: Navegar al directorio del proyecto

```bash
cd ~/ARANDANO
# o donde tengas el proyecto clonado
```

### Paso 3: Instalar dependencias (si es la primera vez)

```bash
npm install
```

### Paso 4: Crear build de producción

```bash
npm run build
```

### Paso 5: Iniciar con PM2

```bash
# Iniciar la aplicación
pm2 start npm --name "arandano-app" -- start

# Configurar PM2 para iniciar al reiniciar el servidor
pm2 startup
pm2 save
```

### Paso 6: Verificar que funciona

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs arandano-app
```

¡Listo! Tu app debería estar corriendo en `http://tu-ip:3000` o `http://tu-dominio.com` (si ya configuraste Nginx).

---

## Opción 2: Si ya tienes Nginx configurado

Si ya ejecutaste el script `setup-ec2.sh` o configuraste Nginx manualmente:

1. **Solo necesitas hacer build y reiniciar PM2:**

```bash
cd ~/ARANDANO
npm run build
pm2 restart arandano-app
```

---

## Opción 3: Despliegue desde tu máquina local

Si prefieres desplegar desde tu máquina local usando Git:

### En tu máquina local:

```bash
# Asegúrate de que tus cambios estén en el repositorio
git add .
git commit -m "Preparar para producción"
git push origin main
```

### En tu EC2:

```bash
cd ~/ARANDANO
git pull origin main
npm install
npm run build
pm2 restart arandano-app
```

---

## Comandos Útiles de PM2

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs
pm2 logs arandano-app

# Ver logs en tiempo real
pm2 logs arandano-app --lines 50

# Reiniciar aplicación
pm2 restart arandano-app

# Detener aplicación
pm2 stop arandano-app

# Iniciar aplicación
pm2 start arandano-app

# Eliminar aplicación de PM2
pm2 delete arandano-app

# Ver uso de recursos
pm2 monit
```

---

## Verificar que Todo Funciona

### 1. Verificar que PM2 está corriendo:

```bash
pm2 status
```

Deberías ver algo como:
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ status  │ restart │ uptime   │
├─────┼──────────────────┼─────────┼─────────┼──────────┤
│ 0   │ arandano-app     │ online  │ 0       │ 5m       │
└─────┴──────────────────┴─────────┴─────────┴──────────┘
```

### 2. Verificar que el puerto 3000 está escuchando:

```bash
sudo netstat -tlnp | grep 3000
# o
sudo ss -tlnp | grep 3000
```

### 3. Probar localmente en el servidor:

```bash
curl http://localhost:3000
```

### 4. Verificar Nginx (si está configurado):

```bash
sudo systemctl status nginx
```

### 5. Probar desde tu navegador:

- `http://tu-ip-publica:3000` (directo a Next.js)
- `http://tu-dominio.com` (a través de Nginx)

---

## Solución de Problemas

### La app no inicia

```bash
# Ver logs detallados
pm2 logs arandano-app --err

# Verificar que el build fue exitoso
ls -la .next

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error de puerto en uso

```bash
# Ver qué está usando el puerto 3000
sudo lsof -i :3000

# Matar el proceso si es necesario
pm2 delete arandano-app
pm2 start npm --name "arandano-app" -- start
```

### La app se cae después de desconectarse

```bash
# Asegúrate de que PM2 esté configurado para iniciar al arrancar
pm2 startup
pm2 save
```

### Verificar variables de entorno (si las necesitas)

```bash
# Crear archivo .env.local si es necesario
nano .env.local
```

---

## Actualizar la Aplicación

Cuando hagas cambios y quieras actualizar:

```bash
cd ~/ARANDANO

# Si usas Git:
git pull origin main

# Instalar nuevas dependencias (si hay)
npm install

# Rebuild
npm run build

# Reiniciar
pm2 restart arandano-app
```

---

## Checklist de Despliegue

- [ ] Conectado a EC2 via SSH
- [ ] Código del proyecto en el servidor
- [ ] Dependencias instaladas (`npm install`)
- [ ] Build exitoso (`npm run build`)
- [ ] Aplicación corriendo con PM2 (`pm2 status` muestra "online")
- [ ] PM2 configurado para iniciar al arrancar (`pm2 startup` y `pm2 save`)
- [ ] Aplicación accesible en `http://localhost:3000`
- [ ] Nginx configurado (si usas dominio)
- [ ] SSL configurado (si usas HTTPS)

---

## Próximos Pasos

1. **Configurar dominio:** Sigue `EC2-DOMAIN-SETUP.md`
2. **Configurar SSL:** Ejecuta `sudo certbot --nginx -d tu-dominio.com`
3. **Configurar monitoreo:** Considera usar PM2 Plus o herramientas similares
4. **Configurar backups:** Asegúrate de tener backups regulares

