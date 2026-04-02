/**
 * Carga .env.local en process.env (solo claves aún no definidas).
 * Sin dependencia de dotenv.
 */
const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(p)) {
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
