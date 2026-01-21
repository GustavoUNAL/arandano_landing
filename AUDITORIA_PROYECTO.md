# 🔍 Auditoría de Software - Arándano Café Bar

**Fecha:** 19 de enero de 2026

## 📊 Resumen Ejecutivo

### Estado Actual
- **Total archivos .js en scripts/:** 77
- **Scripts usados en producción:** 5
- **Archivos .md en raíz:** 10
- **Backups antiguos:** 3 directorios
- **Archivos JSON temporales en data/:** 9

### Objetivo
Limpiar el proyecto eliminando archivos innecesarios, consolidar documentación y mantener solo lo esencial para producción.

---

## ✅ Archivos Necesarios (MANTENER)

### Scripts Usados en Producción
1. ✅ `scripts/migrate-to-sqlite.js` - Migración a SQLite (usado en npm run migrate:sqlite)
2. ✅ `scripts/export-json-to-backup.js` - Backup de JSON (usado en npm run backup:json)
3. ✅ `scripts/configure-server-env.sh` - Configuración de entorno (usado en npm run configure:env)
4. ✅ `scripts/test-api-functions.js` - Tests de API (usado en npm run test:api)
5. ✅ `scripts/pre-deploy-check.js` - Verificación pre-despliegue (usado en npm run pre-deploy)

### Scripts de Utilidad Recomendados (MANTENER)
6. ✅ `scripts/report-inventory-lots.js` - Reportes de inventario
7. ✅ `scripts/report-sales.js` - Reportes de ventas
8. ✅ `scripts/verify-database-consistency.js` - Verificación de consistencia
9. ✅ `scripts/database-organization-report.js` - Reporte de organización
10. ✅ `scripts/import-inventory.js` - Importación de inventario (usado por API)

### Scripts de Deploy (MANTENER)
- ✅ `deploy-ec2.sh` - Despliegue EC2
- ✅ `deploy/ovh/deploy.sh` - Despliegue OVH
- ✅ `deploy/ovh/full-deploy.sh` - Despliegue completo OVH
- ✅ `deploy/ovh/setup-ovh.sh` - Configuración inicial OVH

### Archivos de Configuración (MANTENER)
- ✅ `package.json` - Dependencias del proyecto
- ✅ `package-lock.json` - Lock de dependencias
- ✅ `next.config.js` - Configuración Next.js
- ✅ `tsconfig.json` - Configuración TypeScript
- ✅ `tailwind.config.js` - Configuración Tailwind
- ✅ `postcss.config.js` - Configuración PostCSS
- ✅ `ecosystem.config.js` - Configuración PM2
- ✅ `.eslintrc.json` - Configuración ESLint

### Documentación Esencial (MANTENER)
- ✅ `README.md` - Documentación principal
- ✅ `ADMIN.md` - Guía de administración
- ✅ `MIGRACION_SQLITE.md` - Migración a SQLite
- ✅ `DEPLOY_EC2_COMPLETE.md` - Guía completa de despliegue EC2
- ✅ `DEPLOY_SERVER.md` - Guía de despliegue en servidor
- ✅ `README_DEPLOY_EC2.md` - Guía rápida EC2
- ✅ `VERIFICATION_REPORT.md` - Reporte de verificación
- ✅ `PROJECT_STATUS.md` - Estado del proyecto (actualizar o consolidar)
- ✅ `PROMPT_AGREGAR_LOTE.md` - Template para agregar lotes

---

## 🗑️ Archivos a Eliminar

### Scripts de Tareas Puntuales (Ya Ejecutados)
Estos scripts realizaron tareas específicas que ya se completaron:
- ❌ `scripts/add-a2sas-lot.js`
- ❌ `scripts/add-aguardientes.js`
- ❌ `scripts/add-alkosto-lot.js`
- ❌ `scripts/add-cafe-12enero.js`
- ❌ `scripts/add-carnes-sebastian-lot.js`
- ❌ `scripts/add-exito-lot.js`
- ❌ `scripts/add-ferreteria-maridiaz-expense.js`
- ❌ `scripts/add-jumbo-complete-lot.js`
- ❌ `scripts/add-la-merced-5enero.js`
- ❌ `scripts/add-paty-missing-lot.js`
- ❌ `scripts/add-repisas-expense.js`
- ❌ `scripts/add-tienda-esquina-lot.js`

### Scripts de Verificación Puntual (Ya Ejecutados)
- ❌ `scripts/check-add-a2sas-5enero.js`
- ❌ `scripts/check-inventory-lots.js`
- ❌ `scripts/check-jumbo-lot.js`
- ❌ `scripts/check-marlboro.js`
- ❌ `scripts/check-paty-lot.js`
- ❌ `scripts/check-sales.js`
- ❌ `scripts/verify-alkosto-lot.js`
- ❌ `scripts/verify-carnes-sebastian-lot.js`

### Scripts de Corrección (Ya Aplicadas)
- ❌ `scripts/fix-date-timezone.js`
- ❌ `scripts/fix-duplicate-sales.js`
- ❌ `scripts/fix-incorrect-date.js`
- ❌ `scripts/fix-inventory-categories.js`
- ❌ `scripts/fix-missing-suppliers.js`
- ❌ `scripts/fix-sale-16-to-18.js`
- ❌ `scripts/fix-sales-according-to-manual.js`
- ❌ `scripts/fix-sales-dates.js`

### Scripts de Registro Específicos (Ya Ejecutados)
- ❌ `scripts/register-new-sales.js`
- ❌ `scripts/register-purchases-17enero-mauricio.js`
- ❌ `scripts/register-purchases-17enero.js`
- ❌ `scripts/register-remaining-sales.js`
- ❌ `scripts/register-sales.js`

### Scripts de Conversión Específicos (Ya Ejecutados)
- ❌ `scripts/convert-purchases-to-sales-17enero.js`
- ❌ `scripts/convert-purchases-to-sales.js`

### Scripts de Actualización Específicos (Ya Ejecutados)
- ❌ `scripts/update-cafe-negro-direct.js`
- ❌ `scripts/update-cafe-negro-recipe.js`
- ❌ `scripts/update-coffee-recipes.js`
- ❌ `scripts/update-product-costs.js`
- ❌ `scripts/update-sales-17enero.js`

### Scripts de Verificación Específicos (Ya Ejecutados)
- ❌ `scripts/verify-all-sales.js`
- ❌ `scripts/verify-and-fix-recipes.js`
- ❌ `scripts/verify-and-update-stock-999.js`
- ❌ `scripts/verify-final-sales.js`
- ❌ `scripts/verify-sales-organization.js`

### Scripts de Organización (Ya Ejecutados)
- ❌ `scripts/reorganize-inventory-categories.js`
- ❌ `scripts/reorganize-sales-final.js`

### Scripts Duplicados o Obsoletos
- ❌ `scripts/cleanup-and-verify.js` - Obsoleto, usar pre-deploy-check.js
- ❌ `scripts/final-cleanup.js` - Tarea ya completada
- ❌ `scripts/delete-duplicate-sales.js` - Tarea ya completada
- ❌ `scripts/count-total-sales.js` - Funcionalidad en report-sales.js
- ❌ `scripts/compare-sales-manual.js` - Análisis puntual completado
- ❌ `scripts/analyze-sales.js` - Análisis puntual completado
- ❌ `scripts/enhance-recipes-with-inventory.js` - Tarea ya completada
- ❌ `scripts/create-basic-recipes.js` - Tarea ya completada
- ❌ `scripts/clean-invalid-recipes.js` - Tarea ya completada
- ❌ `scripts/get-and-update-cafe-recipe.js` - Tarea ya completada
- ❌ `scripts/assign-lots-to-inventory.js` - Tarea ya completada
- ❌ `scripts/audit-database.js` - Funcionalidad en verify-database-consistency.js
- ❌ `scripts/generate-complete-report.js` - Usar report-sales.js y report-inventory-lots.js
- ❌ `scripts/generate-menu-plain-text.js` - No usado en producción
- ❌ `scripts/generate-menu-summary.js` - No usado en producción
- ❌ `scripts/inspect-excel.js` - Herramienta temporal
- ❌ `scripts/test-grouping.js` - Test temporal
- ❌ `scripts/test-sales-grouping.js` - Test temporal
- ❌ `scripts/test-sales-ovh.js` - Test temporal
- ❌ `scripts/test-stock-calculations.js` - Test temporal
- ❌ `scripts/verify-system-functions.js` - Test manual, ya ejecutado

### Archivos Temporales en data/
- ❌ `data/cafe-negro-update.json` - Actualización temporal
- ❌ `data/recipes-creation-results.json` - Resultados temporales
- ❌ `data/recipes-to-create.json` - Datos temporales
- ❌ `data/recipes-verification-results.json` - Resultados temporales

### Archivos Obsoletos
- ❌ `data/database.db` - Base de datos antigua (duplicado de arandano.db)
- ❌ `data/Inventario_Cafeteria_Bar_03_01_26.xlsx` - Archivo Excel original (ya importado)

### Scripts de Deploy Duplicados
- ⚠️ `setup-domain.sh` - Verificar si se usa (posiblemente obsoleto)
- ⚠️ `setup-ec2.sh` - Verificar si se usa (posiblemente obsoleto)
- ⚠️ `setup-https.sh` - Verificar si se usa (posiblemente obsoleto)

---

## 📦 Archivos a Consolidar/Mover

### Backups
Los backups antiguos pueden consolidarse o moverse a un directorio de archivo:
- `backups/pre-migration/` - Backup previo a migración
- `backups/production_backup_20260105_131919/` - Backup de producción
- `backups/production_backup_20260105_131922/` - Backup de producción

**Recomendación:** Mantener solo el backup más reciente y mover los antiguos a `backups/archive/` o comprimirlos.

### Reports
- `reports/` - Los reportes CSV y MD pueden mantenerse como historial o moverse a `reports/archive/`

---

## 📝 Recomendaciones

### Estructura Final Recomendada

```
ARANDANO/
├── app/                    # Código de la aplicación Next.js
├── components/             # Componentes React
├── lib/                    # Bibliotecas y utilidades
├── public/                 # Archivos estáticos
├── scripts/                # Scripts esenciales (10-15 archivos)
│   ├── migrate-to-sqlite.js
│   ├── export-json-to-backup.js
│   ├── configure-server-env.sh
│   ├── test-api-functions.js
│   ├── pre-deploy-check.js
│   ├── report-inventory-lots.js
│   ├── report-sales.js
│   ├── verify-database-consistency.js
│   ├── database-organization-report.js
│   └── import-inventory.js
├── deploy/                 # Scripts de despliegue
├── data/                   # Solo archivos activos
│   ├── arandano.db        # Base de datos SQLite
│   ├── products.json      # Backup/fallback JSON
│   ├── inventory.json     # Backup/fallback JSON
│   ├── sales.json         # Backup/fallback JSON
│   ├── expenses.json      # Backup/fallback JSON
│   └── tasks.json         # Backup/fallback JSON
├── backups/               # Backups consolidados
└── docs/                  # Documentación (opcional)
    └── DEPRECATED/        # Scripts deprecados movidos aquí
```

### Acciones Sugeridas

1. **Eliminar scripts puntuales:** ~60 archivos
2. **Consolidar backups:** Mover a backups/archive/
3. **Limpiar data/:** Eliminar archivos temporales
4. **Actualizar PROJECT_STATUS.md:** Remover referencias a scripts eliminados
5. **Crear .gitignore adicional:** Para archivos temporales

---

## ✅ Resultado Esperado

Después de la limpieza:
- **Scripts:** ~77 → ~10-15 archivos (reducción ~80%)
- **Documentación:** Consolidada y actualizada
- **Proyecto:** Más mantenible y fácil de navegar
- **Build:** Sin cambios, funcionalidad intacta
