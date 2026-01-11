# 🔧 Solución: Error de Build - @opentelemetry/api

## Problema

Error al ejecutar `npm run build`:

```
Error: Cannot find module '@opentelemetry/api'
Build error occurred
Error: Failed to collect page data for /api/expenses/[id]
```

## Solución

El problema es que las dependencias no están completamente instaladas. Necesitas reinstalar todo.

### Solución Rápida (Copy & Paste)

Ejecuta estos comandos en el servidor OVH:

```bash
cd ~/projects/arandano_landing

# 1. Limpiar node_modules y package-lock.json
rm -rf node_modules package-lock.json .next

# 2. Reinstalar todas las dependencias
npm install

# 3. Verificar que @opentelemetry/api se instaló
npm list @opentelemetry/api

# 4. Intentar build de nuevo
npm run build
```

### Si Aún No Funciona

#### Opción 1: Instalar @opentelemetry/api Manualmente

```bash
cd ~/projects/arandano_landing

# Instalar @opentelemetry/api específicamente
npm install @opentelemetry/api

# Verificar instalación
npm list @opentelemetry/api

# Intentar build de nuevo
npm run build
```

#### Opción 2: Verificar Versión de Node.js

```bash
# Verificar versión de Node.js
node -v
npm -v

# Debe ser Node.js v18.x.x o superior
# Si es muy antigua, actualizar:

# Actualizar Node.js a v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar nueva versión
node -v
npm -v

# Reinstalar dependencias
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

#### Opción 3: Instalar con npm ci

```bash
cd ~/projects/arandano_landing

# Limpiar todo
rm -rf node_modules package-lock.json .next

# Regenerar package-lock.json
npm install

# Usar npm ci para instalación limpia (si tienes package-lock.json)
npm ci

# Intentar build
npm run build
```

## Verificación

Después de reinstalar, verifica:

```bash
# 1. Verificar que @opentelemetry/api está instalado
npm list @opentelemetry/api
# Debe mostrar algo como: @opentelemetry/api@1.x.x

# 2. Verificar firebase-admin
npm list firebase-admin
# Debe mostrar: firebase-admin@12.x.x

# 3. Verificar que @opentelemetry/api está en node_modules
ls -la node_modules/@opentelemetry/api
# Debe existir el directorio

# 4. Probar build
npm run build
```

## Comandos Completos (Una Línea)

```bash
cd ~/projects/arandano_landing && rm -rf node_modules package-lock.json .next && npm install && npm list @opentelemetry/api && npm run build
```

## Si el Build Sigue Fallando

1. **Verificar logs completos:**
   ```bash
   npm run build 2>&1 | tee build-error.log
   ```

2. **Verificar que todas las dependencias están instaladas:**
   ```bash
   npm list --depth=0
   ```

3. **Limpiar caché de npm:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json .next
   npm install
   npm run build
   ```

4. **Verificar permisos:**
   ```bash
   ls -la node_modules | head -20
   # Si hay problemas de permisos:
   sudo chown -R $USER:$USER node_modules
   ```

## Notas Importantes

1. **`@opentelemetry/api`** es una dependencia transitiva de `firebase-admin` v12.7.0
2. Debe instalarse automáticamente con `npm install`
3. Si no se instala, puede ser un problema con:
   - Versión de Node.js muy antigua
   - Problemas de red durante la instalación
   - Corrupción en node_modules o package-lock.json
4. La solución más efectiva es **limpiar todo y reinstalar** (`rm -rf node_modules package-lock.json && npm install`)

---

¡Después de seguir estos pasos, el build debería funcionar correctamente! 🎉
