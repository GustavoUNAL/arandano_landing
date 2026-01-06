# Guía de Despliegue - Versión 3

## 🚀 Preparación Pre-Despliegue

### 1. Verificar Variables de Entorno

Asegúrate de tener todas las variables de entorno configuradas. Usa `.env.example` como referencia.

**Variables Críticas:**
- `DB_MODE=firebase` - Debe estar en 'firebase' para producción
- `FIREBASE_SERVICE_ACCOUNT` - JSON completo del service account
- Todas las variables `NEXT_PUBLIC_FIREBASE_*`

### 2. Verificar Firebase

```bash
# Verificar conexión a Firebase
npm run test:firebase

# Verificar configuración
npm run check:firebase

# Verificar datos (opcional)
npm run verify:firebase
```

### 3. Pre-Deploy Check

```bash
# Ejecutar verificación pre-despliegue
npm run pre-deploy
```

Este script verifica:
- ✅ Variables de entorno configuradas
- ✅ Conexión a Firebase
- ✅ Build sin errores
- ✅ Todas las dependencias instaladas

## 📦 Build Local

```bash
# Instalar dependencias
npm install

# Crear build de producción
npm run build

# Verificar que el build fue exitoso
# Deberías ver: "✓ Compiled successfully"
```

## 🖥️ Despliegue en EC2

### Opción 1: Script Automático

```bash
# Dar permisos de ejecución
chmod +x deploy-production.sh

# Ejecutar despliegue
./deploy-production.sh
```

### Opción 2: Manual

```bash
# 1. Conectar a EC2
ssh ubuntu@your-ec2-ip

# 2. Navegar al proyecto
cd ~/ARANDANO

# 3. Actualizar código
git pull origin main

# 4. Instalar dependencias
npm install

# 5. Configurar variables de entorno
# Editar .env o configurar en el sistema
nano .env

# 6. Crear build
npm run build

# 7. Reiniciar aplicación
pm2 restart arandano-app

# 8. Verificar logs
pm2 logs arandano-app
```

## 🔧 Configuración de Variables de Entorno en EC2

### Opción 1: Archivo .env

```bash
# En EC2, crear archivo .env
nano ~/ARANDANO/.env

# Pegar todas las variables de entorno
# Guardar y salir (Ctrl+X, Y, Enter)
```

### Opción 2: Variables del Sistema

```bash
# Agregar al ~/.bashrc o ~/.profile
export DB_MODE=firebase
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
export NEXT_PUBLIC_FIREBASE_API_KEY=your-key
# ... etc

# Recargar
source ~/.bashrc
```

### Opción 3: PM2 Ecosystem

Crear `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'arandano-app',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      DB_MODE: 'firebase',
      FIREBASE_SERVICE_ACCOUNT: '{"type":"service_account",...}',
      // ... otras variables
    }
  }]
}
```

Luego:
```bash
pm2 start ecosystem.config.js
pm2 save
```

## ✅ Checklist de Despliegue

### Pre-Despliegue
- [ ] Variables de entorno configuradas
- [ ] Firebase configurado y verificado
- [ ] Build local exitoso (`npm run build`)
- [ ] Sin errores de TypeScript
- [ ] Sin errores de ESLint

### Despliegue
- [ ] Código actualizado en servidor (git pull)
- [ ] Dependencias instaladas (npm install)
- [ ] Variables de entorno configuradas en servidor
- [ ] Build exitoso en servidor
- [ ] Aplicación reiniciada (pm2 restart)
- [ ] Logs verificados (pm2 logs)

### Post-Despliegue
- [ ] Aplicación accesible vía HTTPS
- [ ] Firebase conectado correctamente
- [ ] Datos se guardan en Firebase
- [ ] No hay errores en consola del navegador
- [ ] Funcionalidades principales probadas

## 🔍 Verificación Post-Despliegue

### 1. Verificar Aplicación

```bash
# En EC2, verificar que PM2 está corriendo
pm2 status

# Ver logs en tiempo real
pm2 logs arandano-app --lines 50

# Verificar que el puerto 3000 está escuchando
sudo netstat -tlnp | grep 3000
```

### 2. Verificar Firebase

```bash
# En el servidor
npm run test:firebase

# Verificar datos
npm run verify:firebase
```

### 3. Verificar en Navegador

1. Abrir la aplicación en el navegador
2. Abrir DevTools (F12)
3. Verificar consola - no debería haber errores
4. Probar funcionalidades:
   - Sistema de cobros
   - Crear/editar productos
   - Ver ventas
   - Verificar que los datos se guardan

## 🐛 Solución de Problemas

### Error: Firebase no conecta

```bash
# Verificar variables de entorno
echo $FIREBASE_SERVICE_ACCOUNT

# Verificar que el service account es válido
npm run test:firebase

# Ver logs detallados
pm2 logs arandano-app --err
```

### Error: Build falla

```bash
# Limpiar cache
rm -rf .next
rm -rf node_modules

# Reinstalar
npm install

# Rebuild
npm run build
```

### Error: Datos no se guardan

1. Verificar que `DB_MODE=firebase`
2. Verificar conexión a Firebase
3. Verificar permisos de Firestore
4. Revisar logs: `pm2 logs arandano-app`

### Error: Aplicación no carga

```bash
# Verificar PM2
pm2 status
pm2 logs arandano-app

# Verificar Nginx
sudo systemctl status nginx
sudo nginx -t

# Verificar puerto
sudo netstat -tlnp | grep 3000
```

## 📝 Notas Importantes

1. **Firebase en Producción**: Asegúrate de que `DB_MODE=firebase` esté configurado
2. **Service Account**: El JSON debe estar como string, no como archivo
3. **Seguridad**: Nunca commitees el archivo `.env` al repositorio
4. **Backups**: Considera hacer backup de Firebase antes de despliegues grandes
5. **Monitoreo**: Revisa los logs regularmente con `pm2 logs`

## 🔄 Actualización Futura

Para actualizar la aplicación:

```bash
cd ~/ARANDANO
git pull origin main
npm install
npm run build
pm2 restart arandano-app
pm2 logs arandano-app
```

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs: `pm2 logs arandano-app`
2. Verifica Firebase: `npm run test:firebase`
3. Revisa este documento y `DEPLOY.md`
4. Verifica `BUILD_CHECKLIST_V3.md`

