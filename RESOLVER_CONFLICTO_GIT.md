# 🔧 Resolver Conflicto de Git en EC2

## ⚡ Solución Rápida

Ejecuta estos comandos **en el servidor EC2**:

```bash
cd ~/projects/arandano_landing

# 1. Ver el conflicto en package.json
cat package.json | grep -A 5 -B 5 "<<<<<<<"

# 2. Resolver el conflicto manualmente o usar nuestra versión
# Opción A: Usar la versión local (la que acabamos de actualizar)
git checkout --ours package.json

# Opción B: Usar la versión remota
# git checkout --theirs package.json

# 3. Agregar el archivo resuelto
git add package.json

# 4. Agregar los otros cambios si los quieres
git add data/sales.json data/tasks.json package-lock.json

# 5. Completar el merge
git commit -m "Resolve merge conflict in package.json and update dependencies"

# 6. Verificar estado
git status
```

## 📋 Pasos Detallados

### 1. Ver el Conflicto

```bash
cat package.json
```

Busca las líneas que dicen:
```
<<<<<<< HEAD
...tu versión local...
=======
...versión remota...
>>>>>>> origin/main
```

### 2. Resolver el Conflicto

**Opción A: Mantener tu versión local (recomendado si actualizaste Firebase)**
```bash
git checkout --ours package.json
```

**Opción B: Usar la versión remota**
```bash
git checkout --theirs package.json
```

**Opción C: Editar manualmente**
```bash
nano package.json
# Elimina las líneas <<<<<<<, =======, >>>>>>>
# Mantén la versión que quieras
```

### 3. Completar el Merge

```bash
# Agregar el archivo resuelto
git add package.json

# Si quieres incluir los otros cambios
git add data/sales.json data/tasks.json package-lock.json

# Completar el merge
git commit -m "Resolve merge conflict: update package.json with latest Firebase versions"
```

### 4. Sincronizar con Remoto

```bash
# Si quieres mantener tu versión y forzar
git push origin main

# O si prefieres hacer pull primero
git pull origin main --rebase
```

## ⚠️ Recomendación

Como acabamos de actualizar `package.json` con versiones más recientes de Firebase, usa:

```bash
git checkout --ours package.json
git add package.json
git commit -m "Resolve merge: keep updated Firebase versions"
```

Esto mantendrá las versiones actualizadas que acabamos de configurar.
