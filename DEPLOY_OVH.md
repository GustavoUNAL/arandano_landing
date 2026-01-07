# 🚀 Despliegue en OVH - Guía Rápida

Esta es la guía principal para desplegar Arándano Café Bar en un servidor OVH Cloud.

## ⚡ Inicio Rápido

```bash
# 1. En el servidor OVH, clonar el proyecto
git clone tu-repositorio.git arandano
cd arandano

# 2. Ejecutar setup completo
bash deploy/ovh/quick-start.sh tu-dominio.com tu-email@ejemplo.com
```

O paso a paso:

```bash
# 1. Setup inicial del servidor
bash deploy/ovh/setup-ovh.sh

# 2. Configurar variables de entorno
cp deploy/ovh/env.example .env.local
nano .env.local  # Editar con tus valores

# 3. Subir firebase-service-account.json
# (Desde tu máquina local)
scp firebase-service-account.json usuario@servidor:~/arandano/

# 4. Desplegar aplicación
bash deploy/ovh/deploy.sh

# 5. Configurar Nginx
bash deploy/ovh/configure-nginx.sh tu-dominio.com

# 6. Configurar SSL
bash deploy/ovh/setup-ssl.sh tu-dominio.com tu-email@ejemplo.com
```

## 📚 Documentación Completa

Para instrucciones detalladas, consulta:
- **[deploy/ovh/README.md](deploy/ovh/README.md)** - Guía completa paso a paso
- **[deploy/ovh/CHECKLIST.md](deploy/ovh/CHECKLIST.md)** - Checklist de verificación

## 📁 Estructura de Archivos

```
deploy/ovh/
├── README.md                 # Documentación completa
├── CHECKLIST.md              # Checklist de despliegue
├── setup-ovh.sh              # Setup inicial del servidor
├── deploy.sh                 # Script de despliegue
├── configure-nginx.sh        # Configuración de Nginx
├── setup-ssl.sh              # Configuración de SSL
├── quick-start.sh            # Inicio rápido (todo en uno)
└── env.example               # Ejemplo de variables de entorno
```

## 🎯 Comandos Principales

```bash
# Setup inicial (primera vez)
npm run setup:ovh

# Desplegar aplicación
npm run deploy:ovh
# o
bash deploy/ovh/deploy.sh

# Verificar estado
pm2 status
npm run diagnose:firebase
```

## 🔍 Verificación

```bash
# Ver estado de la aplicación
pm2 status
pm2 logs arandano-app

# Verificar Firebase
npm run diagnose:firebase

# Verificar Nginx
sudo systemctl status nginx
sudo nginx -t
```

## 📝 Notas Importantes

1. **Primera vez**: Ejecuta `setup-ovh.sh` para instalar todas las dependencias
2. **Variables de entorno**: Configura `.env.local` antes de desplegar
3. **Firebase**: Asegúrate de tener `firebase-service-account.json`
4. **DNS**: Configura DNS antes de configurar SSL
5. **Backups**: Ejecuta `npm run backup:firebase` regularmente

## 🆘 Solución de Problemas

Consulta la sección de [Solución de Problemas](deploy/ovh/README.md#solución-de-problemas) en la documentación completa.

