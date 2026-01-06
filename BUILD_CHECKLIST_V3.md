# Checklist de Build - Versión 3

## Pre-Build

- [ ] Verificar que `DB_MODE=firebase` esté configurado en variables de entorno
- [ ] Verificar que todas las credenciales de Firebase estén configuradas
- [ ] Ejecutar `npm install` para asegurar dependencias actualizadas
- [ ] Verificar conexión a Firebase: `npm run test:firebase`

## Build

```bash
npm run build
```

## Verificaciones Post-Build

- [ ] Verificar que no hay errores de TypeScript
- [ ] Verificar que no hay errores de ESLint
- [ ] Verificar que todas las rutas API compilan correctamente
- [ ] Verificar que los archivos `db-*.ts` están siendo usados

## Variables de Entorno Requeridas

```env
# Firebase
DB_MODE=firebase
FIREBASE_SERVICE_ACCOUNT=<JSON string>
NEXT_PUBLIC_FIREBASE_API_KEY=<key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app id>
```

## Optimizaciones para iPhone 12 Pro

- [x] Viewport configurado con `viewport-fit: cover`
- [x] Safe area insets configurados
- [x] Tap highlights optimizados
- [x] Metadata de Apple Web App configurada

## Archivos Críticos

- `lib/db-products.ts` - Productos con Firebase
- `lib/db-sales.ts` - Ventas con Firebase
- `lib/db-inventory.ts` - Inventario con Firebase
- `lib/db-expenses.ts` - Gastos con Firebase
- `lib/db-tasks.ts` - Tareas con Firebase
- `lib/firebase-admin.ts` - Configuración de Firebase Admin

## Notas

- Todos los datos ahora se almacenan en Firebase Firestore
- El modo híbrido permite fallback a JSON si Firebase falla
- Optimizado para iPhone 12 Pro (390x844px viewport)

