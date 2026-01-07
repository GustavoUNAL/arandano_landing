# ✅ Checklist de Despliegue OVH

Usa este checklist para asegurar que todo está configurado correctamente.

## 📋 Pre-Despliegue (Local)

- [ ] Código commitado y pusheado al repositorio
- [ ] Build local funciona: `npm run build`
- [ ] Archivo `firebase-service-account.json` listo
- [ ] Variables de entorno documentadas
- [ ] Backup de datos realizado (si aplica)

## 🖥️ Servidor OVH - Setup Inicial

- [ ] Servidor creado y accesible vía SSH
- [ ] Usuario con permisos sudo configurado
- [ ] Puertos abiertos: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- [ ] Script de setup ejecutado: `bash deploy/ovh/setup-ovh.sh`
- [ ] Node.js 20.x instalado: `node -v`
- [ ] PM2 instalado: `pm2 -v`
- [ ] Nginx instalado: `nginx -v`
- [ ] Firewall configurado: `sudo ufw status`

## 📁 Proyecto

- [ ] Proyecto clonado/subido al servidor
- [ ] Directorio del proyecto: `~/arandano`
- [ ] Archivo `firebase-service-account.json` en el directorio raíz
- [ ] Archivo `.env.local` configurado con todas las variables
- [ ] Permisos correctos en archivos sensibles

## 🔥 Firebase

- [ ] `DB_MODE=firebase` en `.env.local`
- [ ] Variables `NEXT_PUBLIC_FIREBASE_*` configuradas
- [ ] Service Account configurado (archivo o variable)
- [ ] Diagnóstico de Firebase exitoso: `npm run diagnose:firebase`
- [ ] Conexión a Firebase verificada: `npm run test:firebase`

## 🚀 Despliegue

- [ ] Dependencias instaladas: `npm ci`
- [ ] Build creado exitosamente: `npm run build`
- [ ] Aplicación iniciada con PM2: `pm2 status`
- [ ] Aplicación responde: `curl http://localhost:3000`
- [ ] Logs sin errores críticos: `pm2 logs arandano-app`

## 🌐 Nginx

- [ ] Nginx configurado: `bash deploy/ovh/configure-nginx.sh`
- [ ] Configuración válida: `sudo nginx -t`
- [ ] Nginx corriendo: `sudo systemctl status nginx`
- [ ] Sitio accesible vía dominio/IP

## 🔒 SSL/HTTPS

- [ ] DNS configurado apuntando al servidor
- [ ] Certificado SSL obtenido: `bash deploy/ovh/setup-ssl.sh`
- [ ] HTTPS funcionando: `curl https://tu-dominio.com`
- [ ] Renovación automática configurada
- [ ] HTTP redirige a HTTPS

## ✅ Post-Despliegue

- [ ] Aplicación accesible desde navegador
- [ ] APIs funcionando correctamente
- [ ] Firebase conectado y funcionando
- [ ] Backups configurados
- [ ] Monitoreo configurado
- [ ] Logs siendo revisados regularmente

## 🧪 Pruebas

- [ ] Página principal carga correctamente
- [ ] Formularios funcionan
- [ ] APIs responden correctamente
- [ ] Autenticación funciona (si aplica)
- [ ] Datos se guardan en Firebase
- [ ] Sin errores en consola del navegador

## 📊 Monitoreo

- [ ] PM2 monitoreando la aplicación
- [ ] Logs siendo guardados correctamente
- [ ] Alertas configuradas (opcional)
- [ ] Recursos del sistema dentro de límites

## 🔐 Seguridad

- [ ] Firewall configurado
- [ ] SSL/HTTPS habilitado
- [ ] Credenciales seguras
- [ ] Archivos sensibles con permisos correctos (600)
- [ ] `.env.local` no en Git
- [ ] `firebase-service-account.json` no en Git

## 📝 Documentación

- [ ] Credenciales guardadas de forma segura
- [ ] Documentación del despliegue revisada
- [ ] Procedimientos de backup documentados
- [ ] Procedimientos de rollback documentados

---

## 🆘 Si algo falla

1. Revisa los logs: `pm2 logs arandano-app`
2. Ejecuta diagnóstico: `npm run diagnose:firebase`
3. Verifica Nginx: `sudo nginx -t`
4. Consulta la documentación: `deploy/ovh/README.md`

