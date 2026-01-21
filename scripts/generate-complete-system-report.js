#!/usr/bin/env node

/**
 * Script para generar informe completo del sistema
 * Incluye: productos, ventas, lotes, menú, recetas, tareas y gastos
 * 
 * Uso: node scripts/generate-complete-system-report.js
 */

require('dotenv').config({ path: '.env.local' })

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Configurar ruta de la base de datos
const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')

if (!fs.existsSync(dbPath)) {
  console.error('❌ Error: Base de datos no encontrada en:', dbPath)
  process.exit(1)
}

// Conectar a la base de datos
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// Función para formatear moneda
function formatCurrency(amount) {
  if (!amount) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Función para formatear fecha
function formatDate(dateString) {
  if (!dateString) return 'Sin fecha'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Función para generar CSV
function generateCSV(data, headers, filename) {
  const csvDir = path.join(__dirname, '..', 'reports')
  if (!fs.existsSync(csvDir)) {
    fs.mkdirSync(csvDir, { recursive: true })
  }
  
  const csvPath = path.join(csvDir, filename)
  const lines = [headers.join(',')]
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || ''
      // Escapar comillas y envolver en comillas si contiene comas
      const stringValue = String(value).replace(/"/g, '""')
      return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
        ? `"${stringValue}"`
        : stringValue
    })
    lines.push(values.join(','))
  })
  
  fs.writeFileSync(csvPath, lines.join('\n'), 'utf8')
  return csvPath
}

async function generateCompleteReport() {
  console.log('\n📊 GENERANDO INFORME COMPLETO DEL SISTEMA\n')
  console.log('═'.repeat(80))
  
  const reportDate = new Date().toISOString().split('T')[0]
  const reportDir = path.join(__dirname, '..', 'reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  // ========== OBTENER DATOS ==========
  
  console.log('\n📥 Obteniendo datos del sistema...\n')
  
  // Productos
  const products = db.prepare('SELECT * FROM products ORDER BY name').all()
  console.log(`✅ Productos: ${products.length}`)
  
  // Inventario (Lotes)
  const inventory = db.prepare('SELECT * FROM inventory ORDER BY purchaseDate DESC, lot, name').all()
  console.log(`✅ Items de inventario: ${inventory.length}`)
  
  // Ventas
  const sales = db.prepare('SELECT * FROM sales ORDER BY date DESC, hour DESC').all()
  console.log(`✅ Ventas: ${sales.length}`)
  
  // Recetas
  const recipes = db.prepare('SELECT * FROM recipes ORDER BY productName').all()
  console.log(`✅ Recetas: ${recipes.length}`)
  
  // Tareas
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all()
  console.log(`✅ Tareas: ${tasks.length}`)
  
  // Gastos
  const expenses = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all()
  console.log(`✅ Gastos: ${expenses.length}`)
  
  // ========== ANÁLISIS ==========
  
  console.log('\n📊 Analizando datos...\n')
  
  // Análisis de productos
  const productsByCategory = {}
  const productsByType = {}
  let totalProductsValue = 0
  
  products.forEach(product => {
    const category = product.category || 'Sin categoría'
    const type = product.type || 'Sin tipo'
    
    if (!productsByCategory[category]) {
      productsByCategory[category] = { count: 0, products: [] }
    }
    productsByCategory[category].count++
    productsByCategory[category].products.push(product)
    
    if (!productsByType[type]) {
      productsByType[type] = { count: 0, totalStock: 0 }
    }
    productsByType[type].count++
    productsByType[type].totalStock += product.stock || 0
    
    totalProductsValue += ((product.cost || 0) * (product.stock || 0))
  })
  
  // Análisis de inventario por lotes
  const lotsMap = {}
  let totalInventoryValue = 0
  
  inventory.forEach(item => {
    const lot = item.lot || 'sin-lote'
    if (!lotsMap[lot]) {
      lotsMap[lot] = {
        lot: lot,
        supplier: item.supplier || 'Sin proveedor',
        purchaseDate: item.purchaseDate || 'Sin fecha',
        items: [],
        totalQuantity: 0,
        totalValue: 0
      }
    }
    lotsMap[lot].items.push(item)
    lotsMap[lot].totalQuantity += item.quantity || 0
    lotsMap[lot].totalValue += item.totalValue || 0
    totalInventoryValue += item.totalValue || 0
  })
  
  const lots = Object.values(lotsMap).sort((a, b) => {
    const dateA = a.purchaseDate !== 'Sin fecha' ? new Date(a.purchaseDate).getTime() : 0
    const dateB = b.purchaseDate !== 'Sin fecha' ? new Date(b.purchaseDate).getTime() : 0
    return dateB - dateA
  })
  
  // Análisis de ventas
  const salesByDate = {}
  const salesByProduct = {}
  let totalSalesAmount = 0
  let totalSalesCount = 0
  const salesByPaymentMethod = {}
  const salesByChannel = {}
  
  sales.forEach(sale => {
    const date = sale.date || 'Sin fecha'
    if (!salesByDate[date]) {
      salesByDate[date] = { count: 0, total: 0, sales: [] }
    }
    salesByDate[date].count++
    salesByDate[date].total += sale.total || 0
    salesByDate[date].sales.push(sale)
    totalSalesAmount += sale.total || 0
    totalSalesCount++
    
    // Análisis por método de pago
    const paymentMethod = sale.paymentMethod || 'No especificado'
    if (!salesByPaymentMethod[paymentMethod]) {
      salesByPaymentMethod[paymentMethod] = { count: 0, total: 0 }
    }
    salesByPaymentMethod[paymentMethod].count++
    salesByPaymentMethod[paymentMethod].total += sale.total || 0
    
    // Análisis por canal
    const channel = sale.channel || 'presencial'
    if (!salesByChannel[channel]) {
      salesByChannel[channel] = { count: 0, total: 0 }
    }
    salesByChannel[channel].count++
    salesByChannel[channel].total += sale.total || 0
    
    // Análisis por producto en ventas
    try {
      const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items || []
      items.forEach(item => {
        const productName = item.productName || 'Sin nombre'
        if (!salesByProduct[productName]) {
          salesByProduct[productName] = {
            name: productName,
            quantity: 0,
            revenue: 0,
            salesCount: 0
          }
        }
        salesByProduct[productName].quantity += item.quantity || 1
        salesByProduct[productName].revenue += item.totalPrice || item.price || 0
        salesByProduct[productName].salesCount++
      })
    } catch (e) {
      // Ignorar errores de parsing
    }
  })
  
  // Análisis de recetas
  const recipesByCategory = {}
  recipes.forEach(recipe => {
    const category = recipe.category || 'Sin categoría'
    if (!recipesByCategory[category]) {
      recipesByCategory[category] = []
    }
    recipesByCategory[category].push(recipe)
  })
  
  // Análisis de tareas
  const tasksByCategory = {}
  const tasksByPriority = {}
  const tasksByStatus = { completadas: 0, pendientes: 0 }
  
  tasks.forEach(task => {
    const category = task.category || 'Sin categoría'
    const priority = task.priority || 'Sin prioridad'
    
    if (!tasksByCategory[category]) {
      tasksByCategory[category] = { completadas: 0, pendientes: 0, total: 0 }
    }
    tasksByCategory[category].total++
    if (task.completed) {
      tasksByCategory[category].completadas++
      tasksByStatus.completadas++
    } else {
      tasksByCategory[category].pendientes++
      tasksByStatus.pendientes++
    }
    
    if (!tasksByPriority[priority]) {
      tasksByPriority[priority] = { count: 0 }
    }
    tasksByPriority[priority].count++
  })
  
  // Análisis de gastos
  const expensesByCategory = {}
  const expensesByType = {}
  let totalExpensesAmount = 0
  
  expenses.forEach(expense => {
    const category = expense.category || 'Sin categoría'
    const type = expense.type || 'Sin tipo'
    
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = { count: 0, total: 0 }
    }
    expensesByCategory[category].count++
    expensesByCategory[category].total += expense.amount || 0
    
    if (!expensesByType[type]) {
      expensesByType[type] = { count: 0, total: 0 }
    }
    expensesByType[type].count++
    expensesByType[type].total += expense.amount || 0
    
    totalExpensesAmount += expense.amount || 0
  })
  
  // ========== GENERAR REPORTE MARKDOWN ==========
  
  console.log('📝 Generando informe en Markdown...\n')
  
  let report = `# INFORME COMPLETO DEL SISTEMA - ARÁNDANO
**Fecha de generación:** ${formatDate(reportDate)}
**Generado:** ${new Date().toLocaleString('es-CO')}

---

## 📊 RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| Total Productos | ${products.length} |
| Total Items Inventario | ${inventory.length} |
| Total Lotes | ${lots.length} |
| Total Ventas | ${totalSalesCount} |
| Total Recetas | ${recipes.length} |
| Total Tareas | ${tasks.length} |
| Total Gastos | ${expenses.length} |
| **Valor Total Inventario** | **${formatCurrency(totalInventoryValue)}** |
| **Ingresos Totales (Ventas)** | **${formatCurrency(totalSalesAmount)}** |
| **Gastos Totales** | **${formatCurrency(totalExpensesAmount)}** |
| **Ganancia Neta** | **${formatCurrency(totalSalesAmount - totalExpensesAmount)}** |

---

## 📦 PRODUCTOS DEL MENÚ

### Resumen por Tipo

| Tipo | Cantidad | Stock Total |
|------|----------|-------------|
${Object.entries(productsByType).map(([type, data]) => 
  `| ${type} | ${data.count} | ${data.totalStock} |`
).join('\n')}

### Resumen por Categoría

| Categoría | Cantidad Productos |
|-----------|-------------------|
${Object.entries(productsByCategory).map(([category, data]) => 
  `| ${category} | ${data.count} |`
).join('\n')}

### Listado Completo de Productos

| ID | Nombre | Tipo | Categoría | Precio | Stock | Costo | Ganancia Unitaria | Proveedor | Lote |
|----|--------|------|-----------|--------|-------|-------|-------------------|-----------|------|
${products.map(p => {
  const ganancia = (p.price || 0) - (p.cost || 0)
  return `| ${p.id} | ${p.name || 'Sin nombre'} | ${p.type || 'N/A'} | ${p.category || 'N/A'} | ${formatCurrency(p.price || 0)} | ${p.stock || 0} | ${formatCurrency(p.cost || 0)} | ${formatCurrency(ganancia)} | ${p.supplier || 'N/A'} | ${p.lot || 'N/A'} |`
}).join('\n')}

---

## 📥 INVENTARIO Y LOTES

### Resumen de Lotes

**Total de Lotes:** ${lots.length}
**Valor Total del Inventario:** ${formatCurrency(totalInventoryValue)}

| Lote | Proveedor | Fecha Compra | Items | Cantidad Total | Valor Total |
|------|-----------|--------------|-------|----------------|-------------|
${lots.slice(0, 50).map(lot => 
  `| ${lot.lot} | ${lot.supplier} | ${lot.purchaseDate !== 'Sin fecha' ? formatDate(lot.purchaseDate) : 'Sin fecha'} | ${lot.items.length} | ${lot.totalQuantity} | ${formatCurrency(lot.totalValue)} |`
).join('\n')}

### Listado Completo de Items de Inventario

| ID | Nombre | Categoría | Cantidad | Unidad | Precio Unitario | Valor Total | Fecha Compra | Lote | Proveedor |
|----|--------|-----------|----------|--------|-----------------|-------------|--------------|------|-----------|
${inventory.map(item => 
  `| ${item.id} | ${item.name || 'Sin nombre'} | ${item.category || 'N/A'} | ${item.quantity || 0} | ${item.unit || 'N/A'} | ${formatCurrency(item.unitPrice || 0)} | ${formatCurrency(item.totalValue || 0)} | ${item.purchaseDate ? formatDate(item.purchaseDate) : 'Sin fecha'} | ${item.lot || 'N/A'} | ${item.supplier || 'N/A'} |`
).join('\n')}

---

## 💰 VENTAS

### Resumen General

**Total de Ventas:** ${totalSalesCount}
**Ingresos Totales:** ${formatCurrency(totalSalesAmount)}

### Ventas por Método de Pago

| Método de Pago | Cantidad | Total |
|----------------|----------|-------|
${Object.entries(salesByPaymentMethod).map(([method, data]) => 
  `| ${method} | ${data.count} | ${formatCurrency(data.total)} |`
).join('\n')}

### Ventas por Canal

| Canal | Cantidad | Total |
|-------|----------|-------|
${Object.entries(salesByChannel).map(([channel, data]) => 
  `| ${channel} | ${data.count} | ${formatCurrency(data.total)} |`
).join('\n')}

### Top 20 Productos Más Vendidos

| Producto | Cantidad Vendida | Ingresos | Número de Ventas |
|----------|------------------|----------|------------------|
${Object.values(salesByProduct)
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 20)
  .map(p => 
    `| ${p.name} | ${p.quantity} | ${formatCurrency(p.revenue)} | ${p.salesCount} |`
  ).join('\n')}

### Ventas por Fecha (Últimas 30 fechas)

| Fecha | Cantidad Ventas | Total |
|-------|-----------------|-------|
${Object.entries(salesByDate)
  .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
  .slice(0, 30)
  .map(([date, data]) => 
    `| ${formatDate(date)} | ${data.count} | ${formatCurrency(data.total)} |`
  ).join('\n')}

### Listado Completo de Ventas

| ID | Fecha | Hora | Items | Total | Método Pago | Canal |
|----|-------|------|-------|-------|-------------|-------|
${sales.map(sale => {
  try {
    const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items || []
    const itemsSummary = items.map(i => `${i.quantity || 1}x ${i.productName || 'N/A'}`).join(', ')
    return `| ${sale.id} | ${sale.date || 'N/A'} | ${sale.hour || 'N/A'} | ${itemsSummary.substring(0, 100)}${itemsSummary.length > 100 ? '...' : ''} | ${formatCurrency(sale.total || 0)} | ${sale.paymentMethod || 'N/A'} | ${sale.channel || 'presencial'} |`
  } catch (e) {
    return `| ${sale.id} | ${sale.date || 'N/A'} | ${sale.hour || 'N/A'} | Error al parsear | ${formatCurrency(sale.total || 0)} | ${sale.paymentMethod || 'N/A'} | ${sale.channel || 'presencial'} |`
  }
}).join('\n')}

---

## 🍳 RECETAS

### Resumen por Categoría

| Categoría | Cantidad Recetas |
|-----------|------------------|
${Object.entries(recipesByCategory).map(([category, recs]) => 
  `| ${category} | ${recs.length} |`
).join('\n')}

### Listado Completo de Recetas

| ID | Producto | Categoría | Ingredientes |
|----|----------|-----------|--------------|
${recipes.map(recipe => {
  try {
    const ingredients = typeof recipe.ingredients === 'string' 
      ? JSON.parse(recipe.ingredients) 
      : recipe.ingredients || []
    const ingredientsSummary = ingredients.map(i => 
      `${i.quantity || 0} ${i.unit || ''} ${i.name || 'N/A'}`
    ).join(', ')
    return `| ${recipe.id} | ${recipe.productName || 'N/A'} | ${recipe.category || 'N/A'} | ${ingredientsSummary.substring(0, 150)}${ingredientsSummary.length > 150 ? '...' : ''} |`
  } catch (e) {
    return `| ${recipe.id} | ${recipe.productName || 'N/A'} | ${recipe.category || 'N/A'} | Error al parsear |`
  }
}).join('\n')}

---

## ✅ TAREAS

### Resumen General

**Total de Tareas:** ${tasks.length}
**Completadas:** ${tasksByStatus.completadas}
**Pendientes:** ${tasksByStatus.pendientes}
**Tasa de Completitud:** ${tasks.length > 0 ? ((tasksByStatus.completadas / tasks.length) * 100).toFixed(2) : 0}%

### Tareas por Categoría

| Categoría | Total | Completadas | Pendientes |
|-----------|-------|-------------|------------|
${Object.entries(tasksByCategory).map(([category, data]) => 
  `| ${category} | ${data.total} | ${data.completadas} | ${data.pendientes} |`
).join('\n')}

### Tareas por Prioridad

| Prioridad | Cantidad |
|-----------|----------|
${Object.entries(tasksByPriority).map(([priority, data]) => 
  `| ${priority} | ${data.count} |`
).join('\n')}

### Listado Completo de Tareas

| ID | Título | Categoría | Prioridad | Estado | Fecha Creación | Fecha Límite |
|----|--------|-----------|-----------|--------|----------------|--------------|
${tasks.map(task => 
  `| ${task.id} | ${task.title || 'Sin título'} | ${task.category || 'N/A'} | ${task.priority || 'N/A'} | ${task.completed ? '✅ Completada' : '⏳ Pendiente'} | ${task.createdAt ? formatDate(task.createdAt) : 'N/A'} | ${task.dueDate ? formatDate(task.dueDate) : 'N/A'} |`
).join('\n')}

---

## 💸 GASTOS

### Resumen General

**Total de Gastos:** ${expenses.length}
**Total Gastado:** ${formatCurrency(totalExpensesAmount)}

### Gastos por Categoría

| Categoría | Cantidad | Total |
|-----------|----------|-------|
${Object.entries(expensesByCategory).map(([category, data]) => 
  `| ${category} | ${data.count} | ${formatCurrency(data.total)} |`
).join('\n')}

### Gastos por Tipo

| Tipo | Cantidad | Total |
|------|----------|-------|
${Object.entries(expensesByType).map(([type, data]) => 
  `| ${type} | ${data.count} | ${formatCurrency(data.total)} |`
).join('\n')}

### Listado Completo de Gastos

| ID | Descripción | Categoría | Tipo | Monto | Fecha | Notas |
|----|-------------|-----------|------|-------|-------|-------|
${expenses.map(expense => 
  `| ${expense.id} | ${expense.description || 'Sin descripción'} | ${expense.category || 'N/A'} | ${expense.type || 'N/A'} | ${formatCurrency(expense.amount || 0)} | ${expense.date ? formatDate(expense.date) : 'Sin fecha'} | ${expense.notes || 'N/A'} |`
).join('\n')}

---

## 📈 ANÁLISIS FINANCIERO

### Resumen Financiero

| Concepto | Monto |
|----------|-------|
| Ingresos Totales (Ventas) | ${formatCurrency(totalSalesAmount)} |
| Gastos Totales | ${formatCurrency(totalExpensesAmount)} |
| **Ganancia Neta** | **${formatCurrency(totalSalesAmount - totalExpensesAmount)}** |
| Valor Total Inventario | ${formatCurrency(totalInventoryValue)} |
| **Valor Total del Negocio** | **${formatCurrency(totalSalesAmount - totalExpensesAmount + totalInventoryValue)}** |

### Margen de Ganancia

**Margen de Ganancia:** ${totalSalesAmount > 0 ? (((totalSalesAmount - totalExpensesAmount) / totalSalesAmount) * 100).toFixed(2) : 0}%

---

**Fin del Reporte**
*Generado el ${new Date().toLocaleString('es-CO')}*

`
  
  // Guardar reporte MD
  const mdPath = path.join(reportDir, `reporte-completo-sistema-${reportDate}.md`)
  fs.writeFileSync(mdPath, report, 'utf8')
  console.log(`✅ Reporte Markdown guardado: ${mdPath}`)
  
  // ========== GENERAR CSVs ==========
  
  console.log('\n📊 Generando archivos CSV...\n')
  
  // CSV de Productos
  generateCSV(
    products.map(p => ({
      id: p.id,
      nombre: p.name,
      tipo: p.type,
      categoria: p.category,
      precio: p.price,
      stock: p.stock,
      costo: p.cost,
      proveedor: p.supplier,
      lote: p.lot,
      fecha_compra: p.purchaseDate
    })),
    ['id', 'nombre', 'tipo', 'categoria', 'precio', 'stock', 'costo', 'proveedor', 'lote', 'fecha_compra'],
    `productos-completos-${reportDate}.csv`
  )
  console.log('✅ CSV de Productos generado')
  
  // CSV de Inventario
  generateCSV(
    inventory.map(i => ({
      id: i.id,
      nombre: i.name,
      categoria: i.category,
      cantidad: i.quantity,
      unidad: i.unit,
      precio_unitario: i.unitPrice,
      valor_total: i.totalValue,
      fecha_compra: i.purchaseDate,
      lote: i.lot,
      proveedor: i.supplier
    })),
    ['id', 'nombre', 'categoria', 'cantidad', 'unidad', 'precio_unitario', 'valor_total', 'fecha_compra', 'lote', 'proveedor'],
    `inventario-completo-${reportDate}.csv`
  )
  console.log('✅ CSV de Inventario generado')
  
  // CSV de Ventas
  generateCSV(
    sales.map(sale => {
      try {
        const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items || []
        const itemsSummary = items.map(i => `${i.quantity || 1}x ${i.productName || 'N/A'}`).join('; ')
        return {
          id: sale.id,
          fecha: sale.date,
          hora: sale.hour,
          items: itemsSummary,
          total: sale.total,
          metodo_pago: sale.paymentMethod,
          canal: sale.channel || 'presencial'
        }
      } catch (e) {
        return {
          id: sale.id,
          fecha: sale.date,
          hora: sale.hour,
          items: 'Error al parsear',
          total: sale.total,
          metodo_pago: sale.paymentMethod,
          canal: sale.channel || 'presencial'
        }
      }
    }),
    ['id', 'fecha', 'hora', 'items', 'total', 'metodo_pago', 'canal'],
    `ventas-completas-${reportDate}.csv`
  )
  console.log('✅ CSV de Ventas generado')
  
  // CSV de Recetas
  generateCSV(
    recipes.map(recipe => {
      try {
        const ingredients = typeof recipe.ingredients === 'string' 
          ? JSON.parse(recipe.ingredients) 
          : recipe.ingredients || []
        const ingredientsSummary = ingredients.map(i => 
          `${i.quantity || 0} ${i.unit || ''} ${i.name || 'N/A'}`
        ).join('; ')
        return {
          id: recipe.id,
          producto: recipe.productName,
          categoria: recipe.category,
          ingredientes: ingredientsSummary
        }
      } catch (e) {
        return {
          id: recipe.id,
          producto: recipe.productName,
          categoria: recipe.category,
          ingredientes: 'Error al parsear'
        }
      }
    }),
    ['id', 'producto', 'categoria', 'ingredientes'],
    `recetas-completas-${reportDate}.csv`
  )
  console.log('✅ CSV de Recetas generado')
  
  // CSV de Tareas
  generateCSV(
    tasks.map(task => ({
      id: task.id,
      titulo: task.title,
      categoria: task.category,
      prioridad: task.priority,
      completada: task.completed ? 'Sí' : 'No',
      fecha_creacion: task.createdAt,
      fecha_limite: task.dueDate
    })),
    ['id', 'titulo', 'categoria', 'prioridad', 'completada', 'fecha_creacion', 'fecha_limite'],
    `tareas-completas-${reportDate}.csv`
  )
  console.log('✅ CSV de Tareas generado')
  
  // CSV de Gastos
  generateCSV(
    expenses.map(expense => ({
      id: expense.id,
      descripcion: expense.description,
      categoria: expense.category,
      tipo: expense.type,
      monto: expense.amount,
      fecha: expense.date,
      notas: expense.notes
    })),
    ['id', 'descripcion', 'categoria', 'tipo', 'monto', 'fecha', 'notas'],
    `gastos-completos-${reportDate}.csv`
  )
  console.log('✅ CSV de Gastos generado')
  
  // CSV de Lotes
  generateCSV(
    lots.map(lot => ({
      lote: lot.lot,
      proveedor: lot.supplier,
      fecha_compra: lot.purchaseDate,
      cantidad_items: lot.items.length,
      cantidad_total: lot.totalQuantity,
      valor_total: lot.totalValue
    })),
    ['lote', 'proveedor', 'fecha_compra', 'cantidad_items', 'cantidad_total', 'valor_total'],
    `lotes-completos-${reportDate}.csv`
  )
  console.log('✅ CSV de Lotes generado')
  
  console.log('\n' + '═'.repeat(80))
  console.log('✅ INFORME COMPLETO GENERADO EXITOSAMENTE')
  console.log('═'.repeat(80))
  console.log(`\n📄 Reporte Markdown: ${mdPath}`)
  console.log(`📊 Archivos CSV guardados en: ${reportDir}`)
  console.log('\n')
  
  db.close()
}

// Ejecutar
generateCompleteReport().catch(error => {
  console.error('\n❌ Error:', error)
  console.error(error.stack)
  process.exit(1)
})
