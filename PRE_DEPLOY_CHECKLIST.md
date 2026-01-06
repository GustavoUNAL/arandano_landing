# ✅ Checklist Pre-Despliegue - Versión 3

## 🔐 Variables de Entorno

- [ ] `DB_MODE=firebase` configurado
- [ ] `FIREBASE_SERVICE_ACCOUNT` configurado (JSON completo como string)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` configurado
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` configurado
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` configurado
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` configurado
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` configurado
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` configurado
- [ ] `NODE_ENV=production` configurado

## 🔥 Firebase

- [ ] Firebase project creado
- [ ] Firestore Database habilitado
- [ ] Service Account creado y descargado
- [ ] Reglas de Firestore configuradas (`firestore.rules`)
- [ ] Conexión verificada: `npm run test:firebase`
- [ ] Datos migrados (si aplica): `npm run migrate:firebase`

## 📦 Código

- [ ] Todos los cambios commiteados
- [ ] Sin errores de TypeScript: `npm run build`
- [ ] Sin errores de ESLint: `npm run lint`
- [ ] Build local exitoso: `npm run build`
- [ ] Pre-deploy check pasado: `npm run pre-deploy`

## 🖥️ Servidor (EC2)

- [ ] Node.js 18+ instalado
- [ ] npm instalado
- [ ] PM2 instalado: `npm install -g pm2`
- [ ] Nginx instalado y configurado
- [ ] SSL configurado (Let's Encrypt)
- [ ] Security Groups configurados (puertos 80, 443, 22)
- [ ] DNS configurado y propagado

## 📝 Archivos Críticos

- [ ] `.env` configurado en servidor (o variables del sistema)
- [ ] `firebase-service-account.json` en servidor (si se usa archivo)
- [ ] `deploy-v3.sh` con permisos de ejecución
- [ ] Scripts de backup configurados

## 🧪 Pruebas Locales

- [ ] Build funciona: `npm run build`
- [ ] Aplicación inicia: `npm start`
- [ ] Firebase conecta: `npm run test:firebase`
- [ ] Datos se guardan en Firebase
- [ ] No hay errores en consola del navegador

## 📚 Documentación

- [ ] `DEPLOY_V3.md` revisado
- [ ] `VERSION_3.md` revisado
- [ ] `BUILD_CHECKLIST_V3.md` revisado
- [ ] Variables de entorno documentadas

## 🚀 Listo para Desplegar

Una vez completado este checklist, puedes proceder con:

```bash
# Opción 1: Script automático
./deploy-v3.sh

# Opción 2: Manual
git pull origin main
npm install
npm run build
pm2 restart arandano-app
```

## ⚠️ Notas Importantes

1. **Nunca** commitees el archivo `.env`
2. **Siempre** verifica Firebase antes de desplegar
3. **Haz backup** de datos importantes antes de despliegues grandes
4. **Revisa logs** después del despliegue: `pm2 logs arandano-app`

