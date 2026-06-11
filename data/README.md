# Datos — Arándano Café Bar

## Base en la nube (recomendado para la polla)

Para que pronósticos, créditos y ranking se vean **igual en local y en el servidor**, usa **PostgreSQL (Neon)** con la misma `DATABASE_URL` en ambos `.env.local`:

```env
DB_MODE=postgres
DATABASE_URL=postgresql://...@.../neondb?sslmode=require
```

### Configuración inicial

```bash
# 1. Crea un proyecto en https://neon.tech y copia DATABASE_URL a .env.local
# 2. Crea tablas en Neon
npm run init:neon

# 3. (Una vez) migra datos existentes de SQLite local
npm run migrate:sports
```

En el **servidor**, usa la misma `DATABASE_URL` en `~/arandano/.env.local` y `DB_MODE=postgres`. No hace falta copiar `arandano.db`.

### Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run init:neon` | Crea esquema en Neon |
| `npm run migrate:sports` | Copia `sports_users` y `match_predictions` desde SQLite local |

---

## SQLite (solo local / VPS sin nube)

| Archivo | Descripción |
|---------|-------------|
| `arandano.db` | Base de datos principal (café + polla mundialista) |
| `arandano.db-wal` | WAL journal (generado automáticamente) |
| `arandano.db-shm` | Shared memory (generado automáticamente) |

**No subir `*.db*` a Git.** Hacer backup en el servidor antes de cada deploy.

### Tablas de la polla (`sports_*`)

**`sports_users`** — jugadores (Google OAuth)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | TEXT PK | ID de Google (`sub`) |
| `email` | TEXT UNIQUE | |
| `name`, `image` | TEXT | Perfil Google |
| `credits` | INTEGER | Saldo virtual (default 2000 al registrarse) |
| `displayAlias` | TEXT | Alias público (ej. "Jaguar 742") |
| `totalPoints` | INTEGER | Puntos acumulados en la tabla |

**`match_predictions`** — pronósticos

| Campo | Tipo | Notas |
|-------|------|-------|
| `userId` + `matchId` | UNIQUE | Un pick por partido por usuario |
| `homeScore`, `awayScore` | INTEGER | Marcador pronosticado |
| `creditsWagered` | INTEGER | Costo al crear (50) |
| `actualHomeScore`, `actualAwayScore` | INTEGER | Resultado real (al liquidar) |
| `pointsEarned` | INTEGER | 3 exacto / 2 diferencia / 1 resultado / 0 |

### Puntuación (por partido, mejor nivel gana)

| Acierto | Puntos |
|---------|--------|
| Marcador exacto | 3 |
| Diferencia de goles correcta | 2 |
| Resultado (ganador o empate) | 1 |
| Fallo | 0 |

**Ganadores:** hasta 5 en el podio, con mínimo 5 pronósticos calificados. Desempate por exactos → diferencias → resultados → picks calificados.
| `settledAt` | TEXT ISO | Cuándo se calificó |

## JSON (semilla / respaldo)

| Archivo | Uso |
|---------|-----|
| `products.json` | Semilla de productos si SQLite está vacío |
| `sales.json`, `inventory.json`, etc. | Legacy / exportaciones |

## Backup

```bash
bash scripts/backup-sqlite.sh
```

Los backups se guardan en `backups/sqlite/`.
