# Datos — Arándano Café Bar

## SQLite (producción)

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
