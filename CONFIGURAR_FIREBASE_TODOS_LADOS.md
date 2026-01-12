# 🔄 Configurar Firebase en Todos los Entornos

## Objetivo

Configurar ambos entornos (local y OVH) para que **todas las ventas se guarden directamente en Firebase**, permitiendo que se vean reflejadas en cualquier lugar instantáneamente.

## 🎯 Resultado Esperado

Después de configurar:
- ✅ **Local (tu Mac)**: Las ventas se guardan en Firebase
- ✅ **OVH (servidor)**: Las ventas se guardan en Firebase
- ✅ **Sincronización automática**: Cualquier venta registrada en cualquier lugar aparece en ambos
- ✅ **Datos centralizados**: Todas las ventas en un solo lugar (Firebase)

## 📋 Pasos de Configuración

### Paso 1: Configurar Local (tu Mac)

#### Opción A: Usando el Script Automático

```bash
# Ejecutar script de configuración
./scripts/configure-firebase-everywhere.sh
```

#### Opción B: Manualmente

1. **Crear/actualizar `.env.local`:**
   ```bash
   # Si no existe .env.local, crearlo
   echo "DB_MODE=firebase" > .env.local
   
   # O si ya existe, actualizarlo
   sed -i '' 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local
   
   # Verificar
   cat .env.local | grep DB_MODE
   # Debe mostrar: DB_MODE=firebase
   ```

2. **Verificar que `firebase-service-account.json` existe:**
   ```bash
   ls -la firebase-service-account.json
   # Debe existir y ser legible
   ```

3. **Verificar configuración:**
   ```bash
   npm run diagnose:firebase
   ```
   
   Debe mostrar:
   - ✅ DB_MODE configurado correctamente (firebase)
   - ✅ Archivo firebase-service-account.json encontrado
   - ✅ Conexión exitosa a Firebase

4. **Reiniciar aplicación local:**
   ```bash
   # Si estás usando npm run dev, deténlo (Ctrl+C) y vuelve a iniciarlo
   npm run dev
   ```

### Paso 2: Configurar OVH (Servidor)

**En el servidor OVH, ejecuta:**

```bash
cd ~/projects/arandano_landing

# Opción 1: Si tienes acceso al script (después de hacer git pull)
./scripts/configure-firebase-everywhere.sh

# Opción 2: Manualmente
echo "DB_MODE=firebase" >> .env.local || sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local

# Verificar
cat .env.local | grep DB_MODE
# Debe mostrar: DB_MODE=firebase

# Verificar que firebase-service-account.json existe
ls -la firebase-service-account.json

# Verificar configuración
npm run diagnose:firebase

# Si estás usando PM2 (recomendado para producción)
pm2 stop arandano-app
pm2 start ecosystem.config.js
pm2 save
pm2 logs arandano-app --lines 20

# Si estás usando npm run dev (solo desarrollo)
# Detén y reinicia npm run dev
```

### Paso 3: Migrar Ventas Locales Existentes (Opcional)

Si tienes ventas locales en `data/sales.json` que quieres migrar a Firebase:

```bash
# En local (tu Mac)
node scripts/migrate-sales-to-firebase.js
```

Este script:
- Lee las ventas de `data/sales.json`
- Las sube a Firebase
- No duplica ventas que ya existen (usa el ID)

### Paso 4: Verificar que Funciona

#### En Local (tu Mac):

```bash
# Verificar configuración
npm run diagnose:firebase

# Probar crear una venta desde la aplicación
# Luego verificar en Firebase Console que aparece
```

#### En OVH (Servidor):

```bash
# Verificar configuración
npm run diagnose:firebase

# Ver logs para verificar que está usando Firebase
pm2 logs arandano-app | grep -i "firebase\|db_mode"

# Probar API
curl http://localhost:3000/api/sales | jq '. | length'
```

#### Verificar en Firebase Console:

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar tu proyecto
3. Ir a **Firestore Database**
4. Ver colección `sales`
5. Las ventas deberían aparecer ahí

## 🔍 Verificación Completa

### Script de Verificación Rápida

**En Local (tu Mac):**

```bash
cd /Users/gustavo/Documents/Projects/ARANDANO && \
echo "=== 1. DB_MODE ===" && \
cat .env.local | grep DB_MODE 2>/dev/null || echo "  ❌ No configurado" && \
echo "" && \
echo "=== 2. Firebase Service Account ===" && \
ls -la firebase-service-account.json 2>/dev/null && echo "  ✅ Existe" || echo "  ❌ No encontrado" && \
echo "" && \
echo "=== 3. Diagnóstico Firebase ===" && \
npm run diagnose:firebase
```

**En OVH (Servidor):**

```bash
cd ~/projects/arandano_landing && \
echo "=== 1. DB_MODE ===" && \
cat .env.local | grep DB_MODE 2>/dev/null || echo "  ❌ No configurado" && \
echo "" && \
echo "=== 2. Firebase Service Account ===" && \
ls -la firebase-service-account.json 2>/dev/null && echo "  ✅ Existe" || echo "  ❌ No encontrado" && \
echo "" && \
echo "=== 3. Estado PM2 ===" && \
pm2 status && \
echo "" && \
echo "=== 4. Diagnóstico Firebase ===" && \
npm run diagnose:firebase
```

## ✅ Checklist Final

### Local (Mac):
- [ ] `.env.local` existe y tiene `DB_MODE=firebase`
- [ ] `firebase-service-account.json` existe
- [ ] `npm run diagnose:firebase` muestra todo correcto
- [ ] Aplicación reiniciada (`npm run dev`)
- [ ] Puedo crear una venta y se guarda en Firebase

### OVH (Servidor):
- [ ] `.env.local` existe y tiene `DB_MODE=firebase`
- [ ] `firebase-service-account.json` existe
- [ ] `npm run diagnose:firebase` muestra todo correcto
- [ ] PM2 corriendo (o `npm run dev` si es desarrollo)
- [ ] Puedo crear una venta y se guarda en Firebase
- [ ] Las ventas aparecen en Firebase Console

## 🎉 Resultado

Después de completar estos pasos:

1. **Todas las ventas se guardan en Firebase** (no en archivos locales)
2. **Las ventas aparecen instantáneamente** en cualquier lugar que esté conectado a Firebase
3. **Datos centralizados** en Firebase Firestore
4. **Sincronización automática** entre local y OVH

## 🆘 Solución de Problemas

### Error: "DB_MODE no configurado"

**Solución:**
```bash
echo "DB_MODE=firebase" >> .env.local
```

### Error: "firebase-service-account.json no encontrado"

**Solución:**
1. Descargar desde Firebase Console > Project Settings > Service Accounts
2. Guardar como `firebase-service-account.json` en la raíz del proyecto
3. No subir a Git (está en `.gitignore`)

### Error: "Firebase no disponible pero DB_MODE es firebase"

**Solución:**
1. Verificar que `firebase-service-account.json` existe
2. Verificar permisos: `chmod 600 firebase-service-account.json`
3. Verificar contenido: `cat firebase-service-account.json | jq .project_id`
4. Ejecutar: `npm run diagnose:firebase`

### Las ventas no aparecen en Firebase

**Solución:**
1. Verificar `DB_MODE=firebase` en `.env.local`
2. Reiniciar aplicación (PM2 o `npm run dev`)
3. Ver logs: `pm2 logs arandano-app` o consola del navegador
4. Verificar en Firebase Console directamente

---

**Después de configurar, todas las ventas se guardarán directamente en Firebase y aparecerán en cualquier lugar.** 🚀
