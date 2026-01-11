# 🚀 Preparar Push y Deploy en Servidor OVH

## ⚠️ IMPORTANTE: Antes de Hacer Push

Los archivos `data/products.json` y `data/sales.json` tienen cambios locales (ventas guardadas localmente).
**NO debes hacer commit de estos archivos** porque son datos locales.

## 📋 Pasos para Hacer Push

### Paso 1: Revisar Cambios

```bash
git status
```

### Paso 2: NO Hacer Commit de Datos Locales

Los archivos de `data/` no deberían estar en el commit porque son datos locales:

```bash
# Restaurar cambios en archivos de datos (si quieres mantenerlos locales)
git restore data/products.json data/sales.json

# O si quieres descartarlos completamente
# git checkout -- data/products.json data/sales.json
```

### Paso 3: Agregar Solo Archivos Necesarios

```bash
# Agregar scripts nuevos (útiles)
git add scripts/verificar-ventas-firebase.js
git add scripts/migrate-sales-to-firebase.js

# Agregar documentación (útil para referencia)
git add DEPLOY_SERVIDOR_OVH.md
git add SOLUCION_VENTAS_FIREBASE.md
git add GUIA_DESPLIEGUE_OVH.md
git add VERIFICAR_VENTAS_OVH.md

# Opcional: Agregar otros documentos de solución si los necesitas
# git add SOLUCION_BUILD_ERROR.md
# git add SOLUCION_ERROR_500_VENTAS.md
# git add SOLUCION_OVH_VENTAS.md
```

### Paso 4: Hacer Commit y Push

```bash
# Hacer commit
git commit -m "Agregar scripts y documentación para Firebase y despliegue OVH"

# Push a repositorio
git push origin main
# (o la rama que uses)
```

---

## 📋 Pasos en el Servidor OVH (Después del Push)

### Script Completo (Copy & Paste)

Ejecuta estos comandos en el servidor OVH:

```bash
cd ~/projects/arandano_landing && \
echo "=== 1. Actualizando código ===" && \
git pull origin main && \
echo "" && \
echo "=== 2. Configurando DB_MODE=firebase ===" && \
sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local && \
cat .env.local | grep DB_MODE && \
echo "" && \
echo "=== 3. Verificando Firebase ===" && \
ls -la firebase-service-account.json && \
npm run diagnose:firebase && \
echo "" && \
echo "=== 4. Reinstalando dependencias ===" && \
npm install && \
echo "" && \
echo "=== 5. Deteniendo aplicación ===" && \
pm2 stop arandano-app && \
echo "" && \
echo "=== 6. Limpiando build anterior ===" && \
rm -rf .next && \
echo "" && \
echo "=== 7. Creando nuevo build ===" && \
npm run build && \
echo "" && \
echo "=== 8. Reiniciando aplicación ===" && \
pm2 restart arandano-app && \
pm2 save && \
echo "" && \
echo "=== 9. Verificando estado ===" && \
pm2 status && \
echo "" && \
echo "=== 10. Verificando logs (últimos 50) ===" && \
pm2 logs arandano-app --lines 50 --nostream
```

### Paso por Paso (Si Prefieres Ejecutar Manualmente)

```bash
# 1. Conectarse al servidor
ssh ubuntu@tu-ip-ovh

# 2. Ir al directorio
cd ~/projects/arandano_landing

# 3. Actualizar código
git pull origin main

# 4. Configurar DB_MODE
sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local
cat .env.local | grep DB_MODE

# 5. Verificar Firebase
ls -la firebase-service-account.json
npm run diagnose:firebase

# 6. Reinstalar dependencias
npm install

# 7. Detener aplicación
pm2 stop arandano-app

# 8. Limpiar build anterior
rm -rf .next

# 9. Crear nuevo build
npm run build

# 10. Reiniciar aplicación
pm2 restart arandano-app
pm2 save

# 11. Verificar estado
pm2 status
pm2 logs arandano-app --lines 100
```

---

## ✅ Verificación Final

Después de ejecutar en el servidor:

1. **Verificar que DB_MODE=firebase:**
   ```bash
   cat .env.local | grep DB_MODE
   ```

2. **Verificar que la aplicación está corriendo:**
   ```bash
   pm2 status
   # Debe mostrar arandano-app como "online"
   ```

3. **Verificar logs sin errores:**
   ```bash
   pm2 logs arandano-app --lines 100
   # Buscar errores de Firebase o ventas
   ```

4. **Probar API:**
   ```bash
   curl http://localhost:3000/api/sales
   # Debe devolver un array (vacío o con ventas)
   ```

5. **Verificar ventas en Firebase (opcional):**
   ```bash
   node scripts/verificar-ventas-firebase.js
   ```

---

## 🔄 Migrar Ventas Existentes (Opcional)

Si tienes ventas en JSON local que quieres migrar a Firebase:

```bash
# En el servidor, después de configurar DB_MODE=firebase
node scripts/migrate-sales-to-firebase.js
```

---

## ⚠️ Notas Importantes

1. **NO hacer commit de `data/*.json`** - Son archivos de datos locales
2. **DB_MODE=firebase** es crítico para que las ventas se guarden en Firebase
3. **Reiniciar PM2** después de cambiar `.env.local` - PM2 no recarga variables automáticamente
4. **Verificar logs** después de reiniciar para asegurarse de que no hay errores

---

¡Listo! Después de hacer push y ejecutar estos pasos en el servidor, las ventas se guardarán en Firebase. 🎉
