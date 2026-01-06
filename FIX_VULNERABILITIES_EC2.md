# 🔒 Solución de Vulnerabilidades en EC2

## Problema
Al ejecutar `npm install` en el servidor, aparecen vulnerabilidades:
```
14 vulnerabilities (10 moderate, 4 high)
```

## ✅ Solución Rápida

### Opción 1: Script Automático (Recomendado)

En el servidor EC2:
```bash
cd ~/projects/arandano_landing  # O donde esté tu proyecto
bash scripts/fix-vulnerabilities.sh
```

### Opción 2: Manual

```bash
# 1. Actualizar npm
npm install -g npm@latest

# 2. Limpiar cache
npm cache clean --force

# 3. Actualizar Firebase a versiones más recientes
npm install firebase@latest firebase-admin@latest --save

# 4. Actualizar todas las dependencias
npm update

# 5. Intentar resolver automáticamente
npm audit fix

# 6. Verificar vulnerabilidades restantes
npm audit
```

## 📋 Versiones Recomendadas

Las versiones actualizadas en `package.json`:
- `firebase`: `^10.14.1` (última estable)
- `firebase-admin`: `^12.7.0` (última estable)

## ⚠️ Si Hay Vulnerabilidades Críticas

Si después de `npm audit fix` aún hay vulnerabilidades:

1. **Ver detalles:**
   ```bash
   npm audit --audit-level=high
   ```

2. **Si son vulnerabilidades en dependencias indirectas:**
   - Generalmente son seguras si no afectan directamente tu código
   - Firebase y Next.js manejan sus propias dependencias

3. **Si necesitas forzar actualizaciones (cuidado):**
   ```bash
   npm audit fix --force
   ```
   ⚠️ Esto puede romper compatibilidad, úsalo solo si es necesario

## 🔍 Verificar que Todo Funciona

Después de actualizar:
```bash
# 1. Verificar instalación
npm list firebase firebase-admin

# 2. Probar build
npm run build

# 3. Si el build funciona, las vulnerabilidades no son críticas
```

## 📊 Entendiendo las Vulnerabilidades

- **Moderate**: Generalmente no críticas, pero deberían resolverse
- **High**: Más importantes, pero muchas veces son en dependencias indirectas
- **Critical**: Requieren atención inmediata

En la mayoría de casos, las vulnerabilidades en Firebase/Next.js son:
- En dependencias que no usas directamente
- Ya resueltas en versiones más recientes
- No afectan la seguridad de tu aplicación si no usas esas funciones específicas

## ✅ Checklist

- [ ] Dependencias actualizadas
- [ ] `npm audit fix` ejecutado
- [ ] Build funciona: `npm run build`
- [ ] Aplicación inicia: `npm start` o `pm2 restart`

## 🚨 Si el Build Falla Después de Actualizar

1. **Revisar errores:**
   ```bash
   npm run build 2>&1 | tee build-errors.log
   ```

2. **Si hay errores de compatibilidad:**
   ```bash
   # Revertir a versiones anteriores
   npm install firebase@^10.7.1 firebase-admin@^12.0.0 --save
   ```

3. **O usar versiones específicas que funcionan:**
   ```bash
   npm install firebase@10.7.1 firebase-admin@12.0.0 --save-exact
   ```

## 💡 Recomendación

Para producción, es mejor:
1. Actualizar a las versiones más recientes
2. Verificar que el build funciona
3. Si hay vulnerabilidades menores que no afectan tu uso, documentarlas
4. Monitorear actualizaciones de seguridad de Firebase

