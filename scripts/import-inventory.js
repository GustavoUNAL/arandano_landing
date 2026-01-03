const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(__dirname, '../data/Inventario_Cafeteria_Bar_03_01_26.xlsx');
const inventoryPath = path.join(__dirname, '../data/inventory.json');
const productsPath = path.join(__dirname, '../data/products.json');

// Leer el archivo Excel
const workbook = XLSX.readFile(excelPath);
const sheetNames = workbook.SheetNames;

console.log('📋 Hojas encontradas:', sheetNames);

// Leer inventario interno actual
let inventory = [];
if (fs.existsSync(inventoryPath)) {
  inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
}

// Leer productos de venta (solo para actualizar stock si coinciden)
let products = [];
if (fs.existsSync(productsPath)) {
  products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
}

// Función para normalizar texto
const normalize = (str) => {
  if (!str) return '';
  return str.toString().trim().toLowerCase();
};

// Función para buscar en inventario
const findInventoryItem = (name, inventory) => {
  const normalizedName = normalize(name);
  return inventory.find(item => normalize(item.name) === normalizedName);
};

// Función para buscar producto de venta (solo para actualizar stock)
const findProduct = (name, products) => {
  if (!name) return null;
  const normalizedName = normalize(name);
  return products.find(p => {
    const productName = normalize(p.name);
    return productName === normalizedName || 
           productName.includes(normalizedName) || 
           normalizedName.includes(productName);
  });
};

// Mapeo de hojas a categorías de inventario interno
const sheetCategories = {
  'panadería': 'Insumos',
  'Cervezas': 'Bebidas',
  'Licores': 'Bebidas',
  'Licores_Shots': 'Bebidas',
  'Siropes_Bases': 'Insumos',
  'Lacteos': 'Insumos',
  'Insumos_Cafe': 'Insumos',
  'Desechables': 'Insumos',
  'Limpieza': 'Limpieza',
  'Activos': 'Activos'
};

// Función para convertir fecha de Excel a ISO
const excelDateToISO = (excelDate) => {
  if (!excelDate || isNaN(excelDate)) return undefined;
  const date = XLSX.SSF.parse_date_code(excelDate);
  if (date) {
    return new Date(date.y, date.m - 1, date.d).toISOString();
  }
  return undefined;
};

// Procesar cada hoja (solo inventario interno, NO productos de venta)
sheetNames.forEach(sheetName => {
  if (sheetName === 'Resumen_General') return; // Saltar resumen
  
  console.log(`\n📦 Procesando hoja: ${sheetName}`);
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });
  
  const category = sheetCategories[sheetName] || 'Otros';
  
  console.log(`   Filas encontradas: ${data.length}`);
  
  data.forEach((row, index) => {
    try {
      // Obtener nombre del producto
      let name = row['Producto / Descripción'] || 
                 row['Producto'] || 
                 row['__EMPTY'] || 
                 row['BEBIDAS ALCOHÓLICAS - CERVEZAS'] ||
                 row['Nombre'] ||
                 row['name'];
      
      // Si no hay nombre, intentar con la primera columna que tenga valor
      if (!name || normalize(name) === 'código' || normalize(name) === 'total' || normalize(name) === 'producto') {
        const firstValue = Object.values(row).find(v => v && v.toString().trim() && 
          !['Código', 'Producto', 'Total', 'Cantidad', 'Precio'].includes(v.toString().trim()));
        if (firstValue && firstValue.toString().trim().length > 2) {
          name = firstValue.toString().trim();
        } else {
          return; // Saltar fila sin nombre válido
        }
      }
      
      const cleanName = name.toString().trim();
      if (normalize(cleanName) === 'total' || 
          normalize(cleanName) === 'código' || 
          normalize(cleanName) === 'producto' ||
          cleanName.length < 2) {
        return;
      }
      
      // Obtener valores
      const quantity = row['Cantidad'] || 
                     row['Cantidad Real (ml)'] || 
                     row['__EMPTY_3'] ||
                     row['Stock'] ||
                     row['STOCK'];
      
      const unitPrice = row['Precio Unitario (COP)'] || 
                        row['Precio'] || 
                        row['__EMPTY_6'] ||
                        row['Precio Venta'] ||
                        row['PRECIO'];
      
      const totalValue = row['Valor Total (COP)'] || 
                         row['__EMPTY_7'] ||
                         (quantity && unitPrice ? Number(quantity) * Number(unitPrice) : 0);
      
      const unit = row['Unidad'] || 
                   row['Unidad Real'] || 
                   row['__EMPTY_1'] ||
                   row['Tamaño'] ||
                   row['size'] ||
                   'Und';
      
      const code = row['Código'] || row['__EMPTY_0'];
      const purchaseDate = row['Fecha de compra'] || row['Fecha Compra'];
      const supplier = row['Proveedor'] || row['PROVEEDOR'];
      const lot = row['Lote'] || row['LOTE'];
      const notes = row['Observaciones'] || row['Descripción'];
      
      // Solo agregar al inventario interno si tiene cantidad o precio
      if ((quantity && !isNaN(quantity)) || (unitPrice && !isNaN(unitPrice))) {
        // Buscar en inventario interno
        let inventoryItem = findInventoryItem(cleanName, inventory);
        
        if (inventoryItem) {
          // Actualizar item existente
          console.log(`   ✓ Actualizando inventario: ${cleanName}`);
          inventoryItem.quantity = quantity && !isNaN(quantity) ? Number(quantity) : inventoryItem.quantity;
          inventoryItem.unitPrice = unitPrice && !isNaN(unitPrice) ? Number(unitPrice) : inventoryItem.unitPrice;
          inventoryItem.totalValue = totalValue && !isNaN(totalValue) ? Number(totalValue) : (inventoryItem.quantity * inventoryItem.unitPrice);
          inventoryItem.unit = unit ? unit.toString().trim() : inventoryItem.unit;
          inventoryItem.category = category;
          if (code) inventoryItem.code = code.toString();
          if (purchaseDate) {
            const date = excelDateToISO(purchaseDate);
            if (date) inventoryItem.purchaseDate = date;
          }
          if (supplier) inventoryItem.supplier = supplier.toString();
          if (lot) inventoryItem.lot = lot.toString();
          if (notes) inventoryItem.notes = notes.toString();
        } else {
          // Crear nuevo item de inventario interno
          console.log(`   + Nuevo item inventario: ${cleanName}`);
          const newItem = {
            id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: cleanName,
            category: category,
            quantity: quantity && !isNaN(quantity) ? Number(quantity) : 0,
            unit: unit ? unit.toString().trim() : 'Und',
            unitPrice: unitPrice && !isNaN(unitPrice) ? Number(unitPrice) : 0,
            totalValue: totalValue && !isNaN(totalValue) ? Number(totalValue) : 0,
            code: code ? code.toString() : undefined,
            purchaseDate: purchaseDate ? excelDateToISO(purchaseDate) : undefined,
            supplier: supplier ? supplier.toString() : undefined,
            lot: lot ? lot.toString() : undefined,
            notes: notes ? notes.toString() : undefined
          };
          
          inventory.push(newItem);
        }
        
        // OPCIONAL: Si el nombre coincide con un producto de venta, actualizar su stock
        // (Solo para productos que realmente se venden, como cervezas, licores, etc.)
        const product = findProduct(cleanName, products);
        if (product && (category === 'Bebidas' || sheetName === 'panadería')) {
          // Solo actualizar stock si es un producto de venta conocido
          if (quantity && !isNaN(quantity)) {
            product.stock = Number(quantity);
            console.log(`   📦 Stock actualizado para producto de venta: ${product.name} = ${product.stock}`);
          }
        }
      }
    } catch (error) {
      console.error(`   ✗ Error en fila ${index + 2}:`, error.message);
    }
  });
});

// Guardar inventario interno
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2), 'utf8');
console.log(`\n✅ Inventario interno actualizado! Total items: ${inventory.length}`);

// Guardar productos (solo si se actualizó stock)
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
console.log(`✅ Productos de venta actualizados (solo stock)`);

// Mostrar resumen por categoría
const byCategory = {};
inventory.forEach(item => {
  byCategory[item.category] = (byCategory[item.category] || 0) + 1;
});
console.log('\n📊 Items de inventario por categoría:');
Object.entries(byCategory).forEach(([cat, count]) => {
  console.log(`   ${cat}: ${count}`);
});
