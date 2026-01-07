# 📖 Guía Rápida de Despliegue

## 🚀 Despliegue en 3 Pasos

### 1. Hacer Pull del Código
```bash
cd ~/projects/arandano_landing
git pull
```

### 2. Ejecutar Deploy
```bash
bash deploy.sh
```

### 3. Verificar
```bash
pm2 logs arandano-app --lines 20
```

## ✅ Todo Automático

Si configuraste el hook de git, después de `git pull` todo se hace automáticamente:

```bash
git pull
# ✅ Se ejecuta deploy.sh automáticamente
```

## 📋 Configuración Inicial (Solo una vez)

```bash
# 1. Configurar .env.local
echo "DB_MODE=firebase" >> .env.local

# 2. Verificar firebase-service-account.json
ls -la firebase-service-account.json

# 3. Iniciar PM2 (si no está corriendo)
pm2 start npm --name "arandano-app" -- start --update-env
pm2 save
```

## 🔧 Comandos Útiles

```bash
# Ver logs
pm2 logs arandano-app

# Reiniciar
pm2 restart arandano-app --update-env

# Ver estado
pm2 status

# Diagnóstico Firebase
npm run diagnose:firebase
```

## 📚 Documentación Completa

Ver `DESPLIEGUE_AUTOMATICO.md` para detalles completos.

