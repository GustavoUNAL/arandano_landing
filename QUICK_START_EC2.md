# 🚀 Inicio Rápido - Despliegue en EC2

## ⚡ Comandos Rápidos

### En tu Máquina Local (Preparación)
```bash
# 1. Verificar que todo esté listo
npm run pre-deploy

# 2. Crear build de prueba
npm run build

# 3. Verificar Firebase
npm run verify:firebase
```

### En el Servidor EC2 (Primera Vez)

```bash
# 1. Instalar Node.js y herramientas
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2

# 2. Subir proyecto (desde tu máquina local)
scp -r -i tu-clave.pem ./ARANDANO ubuntu@tu-ip-ec2:~/

# 3. Subir archivos de configuración
scp -i tu-clave.pem .env.local ubuntu@tu-ip-ec2:~/ARANDANO/
scp -i tu-clave.pem firebase-service-account.json ubuntu@tu-ip-ec2:~/ARANDANO/

# 4. En el servidor, desplegar
ssh -i tu-clave.pem ubuntu@tu-ip-ec2
cd ~/ARANDANO
bash deploy-production.sh
```

### Actualizar Aplicación (Después de Cambios)

```bash
# En el servidor EC2
cd ~/ARANDANO
git pull origin main  # O subir archivos nuevos
npm install
npm run build
pm2 restart arandano-app
```

## 📋 Checklist Mínimo

- [ ] Node.js 18.x instalado
- [ ] PM2 instalado
- [ ] Nginx instalado
- [ ] `.env.local` configurado
- [ ] `firebase-service-account.json` presente
- [ ] Build creado
- [ ] PM2 corriendo
- [ ] Nginx configurado

## 🔗 Documentación Completa

- **EC2_PRODUCTION_SETUP.md** - Guía detallada paso a paso
- **PRODUCTION_READY.md** - Resumen de estado y checklist
- **FIREBASE_SETUP.md** - Configuración de Firebase

## ⚠️ Importante

1. Cambiar `DB_MODE=firebase` en `.env.local` del servidor
2. Cambiar `ADMIN_PASSWORD` por una contraseña segura
3. Configurar Nginx (ver EC2_PRODUCTION_SETUP.md)
4. Configurar firewall (puertos 22, 80, 443)
