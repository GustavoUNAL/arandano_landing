# 🚀 Pasos para Deploy en Servidor OVH

Guía paso a paso para hacer push y desplegar en el servidor OVH.

## 📋 Pasos en tu Máquina Local

### 1. Verificar Cambios

```bash
git status
git diff
```

### 2. Hacer Commit y Push

```bash
# Agregar cambios
git add .

# Hacer commit
git commit -m "Asegurar que ventas se guarden en Firebase"

# Push a repositorio
git push origin main
# (o la rama que uses: master, develop, etc.)
```

---

## 📋 Pasos en el Servidor OVH

### Paso 1: Conectarse al Servidor

```bash
ssh ubuntu@tu-ip-ovh
# O el usuario que uses
```

### Paso 2: Ir al Directorio del Proyecto

```bash
cd ~/projects/arandano_landing
# O donde tengas el proyecto
```

### Paso 3: Actualizar Código (Si usas Git)

```bash
# Hacer pull de los cambios
git pull origin main
# (o la rama que uses)

# O si no usas Git, subir archivos manualmente con scp
```

### Paso 4: Configurar DB_MODE=firebase

```bash
# Verificar .env.local existe
ls -la .env.local

# Cambiar DB_MODE a firebase
sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local

# Verificar cambio
cat .env.local | grep DB_MODE
# Debe mostrar: DB_MODE=firebase
```

### Paso 5: Verificar Firebase

```bash
# Verificar que firebase-service-account.json existe
ls -la firebase-service-account.json

# Verificar permisos
chmod 600 firebase-service-account.json

# Ejecutar diagnóstico
npm run diagnose:firebase
```

### Paso 6: Reinstalar Dependencias (Si es Necesario)

```bash
# Si hay nuevos scripts o cambios en package.json
npm install
```

### Paso 7: Rebuild de la Aplicación

```bash
# Detener aplicación
pm2 stop arandano-app

# Limpiar build anterior
rm -rf .next

# Crear nuevo build
npm run build

# Verificar que el build fue exitoso
ls -la .next
```

### Paso 8: Reiniciar Aplicación con PM2

```bash
# Reiniciar aplicación
pm2 restart arandano-app

# O si no existe, iniciar de nuevo
# pm2 delete arandano-app
# pm2 start ecosystem.config.js

# Guardar configuración PM2
pm2 save

# Ver estado
pm2 status
```

### Paso 9: Verificar Logs

```bash
# Ver logs en tiempo real
pm2 logs arandano-app --lines 100

# Buscar mensajes de Firebase
pm2 logs arandano-app | grep -i "firebase\|db_mode"

# Verificar que no hay errores
pm2 logs arandano-app | grep -i "error"
```

### Paso 10: Verificar que Funciona

```bash
# Probar API de ventas localmente
curl http://localhost:3000/api/sales

# Debe devolver un array (vacío si no hay ventas) o las ventas existentes

# Verificar diagnóstico
npm run diagnose:firebase

# Verificar ventas en Firebase (si el script existe)
node scripts/verificar-ventas-firebase.js
```

---

## 🔧 Script Completo (Copy & Paste)

Ejecuta estos comandos en el servidor OVH (después de hacer pull):

```bash
cd ~/projects/arandano_landing && \
echo "=== 1. Actualizando DB_MODE ===" && \
sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local && \
cat .env.local | grep DB_MODE && \
echo "" && \
echo "=== 2. Verificando Firebase ===" && \
ls -la firebase-service-account.json && \
npm run diagnose:firebase && \
echo "" && \
echo "=== 3. Reinstalando dependencias ===" && \
npm install && \
echo "" && \
echo "=== 4. Deteniendo aplicación ===" && \
pm2 stop arandano-app && \
echo "" && \
echo "=== 5. Limpiando build anterior ===" && \
rm -rf .next && \
echo "" && \
echo "=== 6. Creando nuevo build ===" && \
npm run build && \
echo "" && \
echo "=== 7. Reiniciando aplicación ===" && \
pm2 restart arandano-app && \
pm2 save && \
echo "" && \
echo "=== 8. Verificando estado ===" && \
pm2 status && \
echo "" && \
echo "=== 9. Verificando logs ===" && \
pm2 logs arandano-app --lines 30 --nostream
```

---

## ✅ Checklist Final

Antes de considerar el despliegue completo:

- [ ] Código actualizado (git pull o scp)
- [ ] `DB_MODE=firebase` en `.env.local`
- [ ] `firebase-service-account.json` existe y tiene permisos 600
- [ ] Diagnóstico de Firebase exitoso: `npm run diagnose:firebase`
- [ ] Dependencias instaladas: `npm install`
- [ ] Build exitoso: `npm run build`
- [ ] Aplicación corriendo: `pm2 status` muestra "online"
- [ ] Logs sin errores críticos: `pm2 logs arandano-app`
- [ ] API funciona: `curl http://localhost:3000/api/sales`
- [ ] Nueva venta se guarda en Firebase (probar desde la aplicación)

---

## 🆘 Si Algo Falla

### Error: "Cannot find module @opentelemetry/api"

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run build
pm2 restart arandano-app
```

### Error: "Firebase no disponible"

```bash
# Verificar Firebase
npm run diagnose:firebase

# Verificar archivo
ls -la firebase-service-account.json
chmod 600 firebase-service-account.json

# Verificar .env.local
cat .env.local | grep DB_MODE
```

### Error: Build falla

```bash
# Ver logs de build
npm run build 2>&1 | tee build-error.log

# Limpiar y reinstalar
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Aplicación no inicia

```bash
# Ver logs completos
pm2 logs arandano-app --lines 200

# Ver información
pm2 info arandano-app

# Eliminar y reiniciar
pm2 delete arandano-app
cd ~/projects/arandano_landing
pm2 start ecosystem.config.js
pm2 save
pm2 logs arandano-app
```

---

## 📝 Notas Importantes

1. **Siempre hacer backup antes de cambios importantes:**
   ```bash
   # Backup de Firebase (si tienes datos)
   npm run backup:firebase
   ```

2. **Verificar que DB_MODE=firebase** - Es crítico para que las ventas se guarden en Firebase

3. **Reiniciar PM2 después de cambiar .env.local** - PM2 no recarga variables de entorno automáticamente

4. **Verificar logs después de reiniciar** - Asegúrate de que no hay errores

---

¡Listo! Después de seguir estos pasos, las ventas se guardarán en Firebase correctamente. 🎉
