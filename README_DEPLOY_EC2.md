# 🚀 Despliegue Rápido en EC2

## ⚡ Comando Único

```bash
bash deploy-ec2.sh
```

Este script hace todo automáticamente:
- ✅ Verifica pre-requisitos (Node.js, PM2, Nginx)
- ✅ Configura variables de entorno
- ✅ Instala dependencias
- ✅ Crea build de producción (standalone)
- ✅ Copia archivos necesarios al build
- ✅ Configura PM2 con ecosystem.config.js
- ✅ Configura Nginx con dominio arandanocafe.com
- ✅ Verifica que todo funcione

## 📋 Antes de Ejecutar

1. **Subir archivos al servidor:**
   ```bash
   # Desde tu máquina local
   scp -i tu-clave.pem .env.local ubuntu@tu-ip-ec2:~/projects/arandano_landing/
   scp -i tu-clave.pem firebase-service-account.json ubuntu@tu-ip-ec2:~/projects/arandano_landing/
   ```

2. **Conectarse al servidor:**
   ```bash
   ssh -i tu-clave.pem ubuntu@tu-ip-ec2
   cd ~/projects/arandano_landing
   ```

3. **Ejecutar el script:**
   ```bash
   bash deploy-ec2.sh
   ```

## ✅ Verificar Despliegue

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs arandano-app

# Probar localmente
curl http://localhost:3000
```

## 🔄 Actualizar Aplicación

```bash
# Hacer pull de cambios
git pull

# Ejecutar script de despliegue
bash deploy-ec2.sh
```

## 📚 Documentación Completa

Ver `DEPLOY_EC2_COMPLETE.md` para guía detallada.

