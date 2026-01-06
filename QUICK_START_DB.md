# 🚀 Inicio Rápido - Base de Datos Online

## Opción Recomendada: Firebase Firestore

### Paso 1: Crear Proyecto Firebase
1. Ve a https://console.firebase.google.com/
2. Crea un nuevo proyecto
3. Habilita Firestore Database

### Paso 2: Obtener Credenciales
1. Configuración del proyecto > Aplicaciones web
2. Copia las credenciales
3. Crea `.env.local` con las variables (ver `.env.example`)

### Paso 3: Instalar Dependencias
\`\`\`bash
npm install
\`\`\`

### Paso 4: Migrar Datos
\`\`\`bash
# Backup primero
npm run backup:json

# Migrar a Firebase
npm run migrate:firebase
\`\`\`

### Paso 5: Activar Firebase
En `.env.local`:
\`\`\`
DB_MODE=hybrid
\`\`\`

## Alternativas

- **Supabase**: PostgreSQL gratuito (ver MIGRATION_GUIDE.md)
- **MongoDB Atlas**: NoSQL gratuito (ver MIGRATION_GUIDE.md)
- **Mantener JSON**: Usar backups manuales

## Documentación Completa

- `MIGRATION_GUIDE.md` - Guía completa
- `FIREBASE_SETUP.md` - Setup detallado de Firebase
- `README_DATABASE.md` - Resumen de opciones
