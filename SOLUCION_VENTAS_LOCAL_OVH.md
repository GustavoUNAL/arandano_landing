# 🔧 Solución: Ventas en Local no Aparecen en OVH

## Problema

Registraste una venta desde `localhost` (tu Mac) y se guardó correctamente, pero no aparece en la aplicación de OVH.

**Causa:**
- Si en **local** estás usando `DB_MODE=json` → Las ventas se guardan en `data/sales.json` (archivo local)
- Si en **OVH** estás usando `DB_MODE=firebase` → Las ventas se guardan en Firebase Firestore
- **Son bases de datos diferentes**, por eso no se ven las ventas de local en OVH

## 🔍 Verificar Configuración Actual

### En Local (tu Mac):

```bash
# Verificar DB_MODE
cat .env.local | grep DB_MODE || echo "DB_MODE no configurado (usa firebase por defecto)"

# Ver ventas locales
cat data/sales.json | jq '. | length' || echo "0 ventas"
```

### En OVH (servidor):

```bash
cd ~/projects/arandano_landing

# Verificar DB_MODE
cat .env.local | grep DB_MODE

# Ver estado de la aplicación
pm2 status

# Ver logs para verificar qué base de datos está usando
pm2 logs arandano-app --lines 20 | grep -i "db_mode\|firebase"
```

## ✅ Solución: Migrar Ventas Locales a Firebase

### Opción 1: Migrar Ventas Existentes (Recomendado)

**En tu Mac (local):**

1. **Asegurar que tienes `firebase-service-account.json`:**
   ```bash
   ls -la firebase-service-account.json
   ```

2. **Migrar las ventas locales a Firebase:**
   ```bash
   node scripts/migrate-sales-to-firebase.js
   ```

   Esto:
   - Lee las ventas de `data/sales.json`
   - Las guarda en Firebase
   - No duplica ventas que ya existen (usa el ID)

3. **Verificar que se migraron:**
   ```bash
   # Ver cuántas ventas hay en Firebase
   npm run diagnose:firebase | grep sales
   ```

4. **Después de migrar, las ventas deberían aparecer en OVH** (si OVH está usando `DB_MODE=firebase`)

### Opción 2: Configurar Local para Usar Firebase También

Si quieres que local también use Firebase (para que las ventas se guarden directamente en Firebase):

**En tu Mac (local):**

1. **Crear/actualizar `.env.local`:**
   ```bash
   # Si no existe .env.local, créalo
   echo "DB_MODE=firebase" > .env.local
   
   # O si ya existe, actualízalo
   sed -i '' 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local
   
   # Verificar
   cat .env.local | grep DB_MODE
   ```

2. **Asegurar que `firebase-service-account.json` existe:**
   ```bash
   ls -la firebase-service-account.json
   ```

3. **Reiniciar la aplicación local:**
   ```bash
   # Si estás usando npm run dev, deténlo (Ctrl+C) y vuelve a iniciarlo
   npm run dev
   ```

4. **Ahora las ventas nuevas se guardarán directamente en Firebase** y aparecerán tanto en local como en OVH

## ⚠️ Nota Importante: npm run dev en OVH

**NO deberías usar `npm run dev` en el servidor OVH en producción.**

En producción deberías usar:
- **PM2 con build de producción** (como se configuró anteriormente)
- **`DB_MODE=firebase`** para persistencia

Si estás usando `npm run dev` en OVH:
1. Es para desarrollo, no producción
2. Los datos pueden no persistir correctamente
3. El rendimiento no es óptimo

**Para usar PM2 en OVH:**
```bash
cd ~/projects/arandano_landing

# Verificar que DB_MODE=firebase
cat .env.local | grep DB_MODE

# Asegurar que el build existe
npm run build

# Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

## 📋 Checklist de Solución

### Paso 1: Migrar Ventas Existentes
- [ ] En local: `node scripts/migrate-sales-to-firebase.js`
- [ ] Verificar que se migraron: `npm run diagnose:firebase | grep sales`

### Paso 2: Configurar Local para Usar Firebase (Opcional pero Recomendado)
- [ ] Crear/actualizar `.env.local` con `DB_MODE=firebase`
- [ ] Verificar que `firebase-service-account.json` existe
- [ ] Reiniciar aplicación local

### Paso 3: Verificar OVH
- [ ] Verificar que OVH tiene `DB_MODE=firebase` en `.env.local`
- [ ] Verificar que OVH está usando PM2 (no `npm run dev`)
- [ ] Verificar que las ventas aparecen en OVH

## 🔄 Flujo Recomendado

**Para Desarrollo Local:**
1. Configurar `DB_MODE=firebase` en `.env.local`
2. Tener `firebase-service-account.json` localmente
3. Ejecutar `npm run dev`
4. Las ventas se guardan directamente en Firebase

**Para Producción (OVH):**
1. Configurar `DB_MODE=firebase` en `.env.local`
2. Tener `firebase-service-account.json` en el servidor
3. Usar PM2 con build de producción (`pm2 start ecosystem.config.js`)
4. Las ventas se guardan en Firebase (misma base de datos que local)

**Resultado:** Las ventas aparecen tanto en local como en OVH porque usan la misma base de datos (Firebase).

## 🆘 Si Aún No Funciona

1. **Verificar conexión a Firebase:**
   ```bash
   npm run diagnose:firebase
   ```

2. **Ver ventas en Firebase directamente:**
   - Ir a Firebase Console > Firestore Database > collection `sales`
   - Verificar que las ventas están ahí

3. **Ver logs en OVH:**
   ```bash
   pm2 logs arandano-app --lines 50
   ```

4. **Verificar que OVH está leyendo de Firebase:**
   ```bash
   # En OVH
   curl http://localhost:3000/api/sales | jq '. | length'
   ```

---

**Después de migrar las ventas y configurar ambos para usar Firebase, las ventas deberían aparecer en ambos lugares.** 🎉
