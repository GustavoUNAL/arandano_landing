# 🚀 Configuración Rápida: Firebase en Todos los Lados

## ⚡ Comando Rápido

### En Local (tu Mac):

```bash
cd /Users/gustavo/Documents/Projects/ARANDANO

# Configurar DB_MODE=firebase
echo "DB_MODE=firebase" > .env.local || sed -i '' 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local

# Verificar
cat .env.local | grep DB_MODE

# Verificar Firebase
npm run diagnose:firebase

# Reiniciar aplicación (si está corriendo)
# Ctrl+C en npm run dev, luego:
npm run dev
```

### En OVH (Servidor):

```bash
cd ~/projects/arandano_landing

# Configurar DB_MODE=firebase
echo "DB_MODE=firebase" >> .env.local || sed -i 's/^DB_MODE=.*/DB_MODE=firebase/' .env.local

# Verificar
cat .env.local | grep DB_MODE

# Verificar Firebase
npm run diagnose:firebase

# Reiniciar con PM2 (recomendado)
pm2 stop arandano-app
pm2 start ecosystem.config.js
pm2 save
pm2 logs arandano-app --lines 20
```

## ✅ Resultado

Después de configurar:
- ✅ Todas las ventas se guardan en Firebase
- ✅ Las ventas aparecen en cualquier lugar (local y OVH)
- ✅ Sincronización automática

## 📋 Checklist

- [ ] `.env.local` tiene `DB_MODE=firebase` en local
- [ ] `.env.local` tiene `DB_MODE=firebase` en OVH
- [ ] `firebase-service-account.json` existe en ambos lugares
- [ ] `npm run diagnose:firebase` muestra todo correcto
- [ ] Aplicaciones reiniciadas

---

**¡Listo! Ahora todas las ventas se guardan directamente en Firebase.** 🎉
