/**
 * Script para generar reporte completo de compras, ventas y activos
 * Genera reporte en Markdown y archivos CSV
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'data', 'arandano.db')
const db = new Database(dbPath)
const reportDir = path.join(__dirname, '..', 'reports')
const timestamp = new Date().toISOString().split('T')[0]

// Crear directorio de reportes si no existe
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true })
}

console.log('\n📊 GENERANDO REPORTE COMPLETO\n')
console.log('=' .repeat(80))

// ============================================
// 1. COMPRAS POR LOTE (INVENTARIO)
// ============================================
console.log('\n📦 Analizando compras de inventario por lote...')

const inventoryItems = db.prepare('SELECT * FROM inventory ORDER BY purchaseDate DESC, lot, name').all()

// Agrupar por lote
const purchasesByLot = {}
inventoryItems.forEach(item => {
  const lotKey = item.lot || 'Sin Lote'
  if (!purchasesByLot[lotKey]) {
    purchasesByLot[lotKey] = {
      lot: lotKey,
      purchaseDate: item.purchaseDate || 'Sin fecha',
      supplier: item.supplier || 'Sin proveedor',
      items: []
    }
  }
  purchasesByLot[lotKey].items.push(item)
})

// Calcular totales por lote
Object.keys(purchasesByLot).forEach(lotKey => {
  const lot = purchasesByLot[lotKey]
  lot.totalValue = lot.items.reduce((sum, item) => sum + (item.totalValue || 0), 0)
  lot.totalItems = lot.items.length
})

// ============================================
// 2. PRODUCTOS CON LOTE (COMPRAS DE PRODUCTOS)
// ============================================
console.log('🛍️  Analizando productos con lotes...')

const productsWithLots = db.prepare(`
  SELECT * FROM products 
  WHERE lot IS NOT NULL AND lot != '' 
  ORDER BY purchaseDate DESC, lot, name
`).all()

// Agrupar productos por lote
const productPurchasesByLot = {}
productsWithLots.forEach(product => {
  const lotKey = product.lot || 'Sin Lote'
  if (!productPurchasesByLot[lotKey]) {
    productPurchasesByLot[lotKey] = {
      lot: lotKey,
      purchaseDate: product.purchaseDate || 'Sin fecha',
      supplier: product.supplier || 'Sin proveedor',
      items: []
    }
  }
  productPurchasesByLot[lotKey].items.push(product)
})

// Calcular totales por lote
Object.keys(productPurchasesByLot).forEach(lotKey => {
  const lot = productPurchasesByLot[lotKey]
  lot.totalCost = lot.items.reduce((sum, item) => sum + ((item.cost || 0) * (item.stock || 0)), 0)
  lot.totalItems = lot.items.length
})

// ============================================
// 3. VENTAS
// ============================================
console.log('💰 Analizando ventas...')

const sales = db.prepare('SELECT * FROM sales ORDER BY date DESC, hour DESC').all()

// Procesar items de ventas
const salesDetails = sales.map(sale => {
  const items = JSON.parse(sale.items || '[]')
  return {
    id: sale.id,
    date: sale.date,
    hour: sale.hour,
    items: items,
    total: sale.total,
    paymentMethod: sale.paymentMethod || 'No especificado',
    channel: sale.channel || 'presencial'
  }
})

// Expandir ventas para tener un registro por producto vendido
const salesExpanded = []
salesDetails.forEach(sale => {
  sale.items.forEach(item => {
    salesExpanded.push({
      saleId: sale.id,
      date: sale.date,
      hour: sale.hour,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || item.price || 0,
      totalPrice: item.totalPrice || ((item.unitPrice || item.price || 0) * (item.quantity || 1)),
      paymentMethod: sale.paymentMethod || 'No especificado'
    })
  })
})

// ============================================
// 4. ACTIVOS ACTUALES (INVENTARIO)
// ============================================
console.log('📋 Analizando activos actuales...')

const currentInventory = db.prepare(`
  SELECT * FROM inventory 
  ORDER BY category, name
`).all()

// ============================================
// GENERAR MARKDOWN
// ============================================
console.log('\n📝 Generando reporte Markdown...')

let markdown = `# REPORTE COMPLETO - ARANDANO
**Fecha de generación:** ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
**Período:** Desde el inicio del historial hasta la fecha actual

---

## 📊 RESUMEN EJECUTIVO

### Compras de Inventario
- **Total de lotes:** ${Object.keys(purchasesByLot).length}
- **Total de items comprados:** ${inventoryItems.length}
- **Valor total invertido:** $${inventoryItems.reduce((sum, item) => sum + (item.totalValue || 0), 0).toLocaleString('es-CO')}

### Productos con Lotes
- **Total de lotes de productos:** ${Object.keys(productPurchasesByLot).length}
- **Total de productos:** ${productsWithLots.length}
- **Costo total:** $${productsWithLots.reduce((sum, p) => sum + ((p.cost || 0) * (p.stock || 0)), 0).toLocaleString('es-CO')}

### Ventas
- **Total de ventas:** ${sales.length}
- **Total recaudado:** $${sales.reduce((sum, s) => sum + (s.total || 0), 0).toLocaleString('es-CO')}
- **Total de items vendidos:** ${salesExpanded.length}

### Activos Actuales
- **Items en inventario:** ${currentInventory.length}
- **Valor total del inventario:** $${currentInventory.reduce((sum, item) => sum + (item.totalValue || 0), 0).toLocaleString('es-CO')}

---

## 📦 COMPRAS DE INVENTARIO POR LOTE

`

// Agregar compras de inventario
Object.keys(purchasesByLot).sort().forEach(lotKey => {
  const lot = purchasesByLot[lotKey]
  markdown += `### Lote: ${lot.lot || 'Sin Lote'}
- **Fecha de compra:** ${lot.purchaseDate}
- **Proveedor:** ${lot.supplier}
- **Total de items:** ${lot.totalItems}
- **Valor total del lote:** $${lot.totalValue.toLocaleString('es-CO')}

| Producto | Categoría | Cantidad | Unidad | Precio Unitario | Valor Total |
|----------|-----------|----------|--------|-----------------|-------------|
`
  lot.items.forEach(item => {
    markdown += `| ${item.name} | ${item.category} | ${item.quantity} | ${item.unit} | $${(item.unitPrice || 0).toLocaleString('es-CO')} | $${(item.totalValue || 0).toLocaleString('es-CO')} |\n`
  })
  markdown += '\n'
})

markdown += `---

## 🛍️ PRODUCTOS COMPRADOS POR LOTE

`

// Agregar productos con lotes
Object.keys(productPurchasesByLot).sort().forEach(lotKey => {
  const lot = productPurchasesByLot[lotKey]
  markdown += `### Lote: ${lot.lot}
- **Fecha de compra:** ${lot.purchaseDate}
- **Proveedor:** ${lot.supplier}
- **Total de productos:** ${lot.totalItems}
- **Costo total del lote:** $${lot.totalCost.toLocaleString('es-CO')}

| Producto | Categoría | Tipo | Stock | Costo Unitario | Costo Total |
|----------|-----------|------|-------|----------------|-------------|
`
  lot.items.forEach(product => {
    const totalCost = (product.cost || 0) * (product.stock || 0)
    markdown += `| ${product.name} | ${product.category} | ${product.type} | ${product.stock || 0} | $${(product.cost || 0).toLocaleString('es-CO')} | $${totalCost.toLocaleString('es-CO')} |\n`
  })
  markdown += '\n'
})

markdown += `---

## 💰 VENTAS DETALLADAS

### Resumen por Venta

| ID Venta | Fecha | Hora | Items | Total | Método de Pago |
|----------|-------|------|-------|-------|----------------|
`
salesDetails.forEach(sale => {
  const date = new Date(sale.date)
  const time = sale.hour ? String(sale.hour).padStart(4, '0').match(/.{1,2}/g).join(':') : '00:00'
  markdown += `| ${sale.id.substring(0, 20)}... | ${date.toLocaleDateString('es-CO')} | ${time} | ${sale.items.length} | $${sale.total.toLocaleString('es-CO')} | ${sale.paymentMethod} |\n`
})

markdown += `\n### Detalle de Items Vendidos

| Fecha | Producto | Cantidad | Precio Unitario | Total | Método de Pago |
|-------|----------|----------|-----------------|-------|----------------|
`
salesExpanded.forEach(item => {
  const date = new Date(item.date)
  markdown += `| ${date.toLocaleDateString('es-CO')} | ${item.productName} | ${item.quantity} | $${item.unitPrice.toLocaleString('es-CO')} | $${item.totalPrice.toLocaleString('es-CO')} | ${item.paymentMethod} |\n`
})

markdown += `\n---

## 📋 ACTIVOS ACTUALES (INVENTARIO)

### Resumen por Categoría
`

// Agrupar por categoría
const inventoryByCategory = {}
currentInventory.forEach(item => {
  if (!inventoryByCategory[item.category]) {
    inventoryByCategory[item.category] = {
      items: [],
      totalValue: 0
    }
  }
  inventoryByCategory[item.category].items.push(item)
  inventoryByCategory[item.category].totalValue += item.totalValue || 0
})

Object.keys(inventoryByCategory).sort().forEach(category => {
  const catData = inventoryByCategory[category]
  markdown += `\n### ${category}
- **Total de items:** ${catData.items.length}
- **Valor total:** $${catData.totalValue.toLocaleString('es-CO')}

| Producto | Cantidad | Unidad | Precio Unitario | Valor Total | Lote | Proveedor | Fecha Compra |
|----------|----------|--------|-----------------|-------------|------|-----------|--------------|
`
  catData.items.forEach(item => {
    markdown += `| ${item.name} | ${item.quantity} | ${item.unit} | $${(item.unitPrice || 0).toLocaleString('es-CO')} | $${(item.totalValue || 0).toLocaleString('es-CO')} | ${item.lot || 'N/A'} | ${item.supplier || 'N/A'} | ${item.purchaseDate || 'N/A'} |\n`
  })
})

markdown += `\n---

## 📈 ESTADÍSTICAS ADICIONALES

### Ventas por Método de Pago
`

const salesByPayment = {}
sales.forEach(sale => {
  const method = sale.paymentMethod || 'No especificado'
  if (!salesByPayment[method]) {
    salesByPayment[method] = { count: 0, total: 0 }
  }
  salesByPayment[method].count++
  salesByPayment[method].total += sale.total || 0
})

markdown += `| Método | Cantidad | Total |
|--------|----------|-------|
`
Object.keys(salesByPayment).sort().forEach(method => {
  const stats = salesByPayment[method]
  markdown += `| ${method} | ${stats.count} | $${stats.total.toLocaleString('es-CO')} |\n`
})

markdown += `\n### Productos Más Vendidos
`

// Agrupar ventas por producto
const salesByProduct = {}
salesExpanded.forEach(item => {
  if (!salesByProduct[item.productName]) {
    salesByProduct[item.productName] = { quantity: 0, revenue: 0 }
  }
  salesByProduct[item.productName].quantity += item.quantity
  salesByProduct[item.productName].revenue += item.totalPrice
})

// Ordenar por cantidad vendida
const topProducts = Object.keys(salesByProduct)
  .map(name => ({ name, ...salesByProduct[name] }))
  .sort((a, b) => b.quantity - a.quantity)
  .slice(0, 10)

markdown += `| Producto | Cantidad Vendida | Ingresos |
|----------|------------------|----------|
`
topProducts.forEach(product => {
  markdown += `| ${product.name} | ${product.quantity} | $${product.revenue.toLocaleString('es-CO')} |\n`
})

markdown += `\n---

*Reporte generado automáticamente el ${new Date().toLocaleString('es-CO')}*
`

// Guardar Markdown
const mdPath = path.join(reportDir, `reporte-completo-${timestamp}.md`)
fs.writeFileSync(mdPath, markdown, 'utf8')
console.log(`✅ Reporte Markdown guardado: ${mdPath}`)

// ============================================
// GENERAR ARCHIVOS CSV
// ============================================
console.log('\n📊 Generando archivos CSV...')

// CSV de compras de inventario
let csvPurchases = 'Lote,Fecha Compra,Proveedor,Producto,Categoría,Cantidad,Unidad,Precio Unitario,Valor Total\n'
Object.keys(purchasesByLot).sort().forEach(lotKey => {
  const lot = purchasesByLot[lotKey]
  lot.items.forEach(item => {
    csvPurchases += `"${lot.lot || 'Sin Lote'}","${lot.purchaseDate}","${lot.supplier}","${item.name}","${item.category}",${item.quantity},"${item.unit}",${item.unitPrice || 0},${item.totalValue || 0}\n`
  })
})
const csvPurchasesPath = path.join(reportDir, `compras-inventario-${timestamp}.csv`)
fs.writeFileSync(csvPurchasesPath, csvPurchases, 'utf8')
console.log(`✅ CSV compras inventario: ${csvPurchasesPath}`)

// CSV de productos con lotes
let csvProducts = 'Lote,Fecha Compra,Proveedor,Producto,Categoría,Tipo,Stock,Costo Unitario,Costo Total\n'
Object.keys(productPurchasesByLot).sort().forEach(lotKey => {
  const lot = productPurchasesByLot[lotKey]
  lot.items.forEach(product => {
    const totalCost = (product.cost || 0) * (product.stock || 0)
    csvProducts += `"${lot.lot}","${lot.purchaseDate}","${lot.supplier}","${product.name}","${product.category}","${product.type}",${product.stock || 0},${product.cost || 0},${totalCost}\n`
  })
})
const csvProductsPath = path.join(reportDir, `productos-lotes-${timestamp}.csv`)
fs.writeFileSync(csvProductsPath, csvProducts, 'utf8')
console.log(`✅ CSV productos lotes: ${csvProductsPath}`)

// CSV de ventas
let csvSales = 'ID Venta,Fecha,Hora,Producto,Cantidad,Precio Unitario,Total,Método Pago\n'
salesExpanded.forEach(item => {
  const time = item.hour ? String(item.hour).padStart(4, '0').match(/.{1,2}/g).join(':') : '00:00'
  csvSales += `"${item.saleId}","${item.date}","${time}","${item.productName}",${item.quantity},${item.unitPrice},${item.totalPrice},"${item.paymentMethod}"\n`
})
const csvSalesPath = path.join(reportDir, `ventas-${timestamp}.csv`)
fs.writeFileSync(csvSalesPath, csvSales, 'utf8')
console.log(`✅ CSV ventas: ${csvSalesPath}`)

// CSV de activos actuales
let csvAssets = 'Producto,Categoría,Cantidad,Unidad,Precio Unitario,Valor Total,Lote,Proveedor,Fecha Compra\n'
currentInventory.forEach(item => {
  csvAssets += `"${item.name}","${item.category}",${item.quantity},"${item.unit}",${item.unitPrice || 0},${item.totalValue || 0},"${item.lot || ''}","${item.supplier || ''}","${item.purchaseDate || ''}"\n`
})
const csvAssetsPath = path.join(reportDir, `activos-actuales-${timestamp}.csv`)
fs.writeFileSync(csvAssetsPath, csvAssets, 'utf8')
console.log(`✅ CSV activos actuales: ${csvAssetsPath}`)

db.close()

console.log('\n' + '='.repeat(80))
console.log('✅ REPORTE COMPLETO GENERADO EXITOSAMENTE')
console.log('='.repeat(80))
console.log(`\n📁 Ubicación de archivos:`)
console.log(`   - Markdown: ${mdPath}`)
console.log(`   - CSV Compras Inventario: ${csvPurchasesPath}`)
console.log(`   - CSV Productos Lotes: ${csvProductsPath}`)
console.log(`   - CSV Ventas: ${csvSalesPath}`)
console.log(`   - CSV Activos: ${csvAssetsPath}\n`)
