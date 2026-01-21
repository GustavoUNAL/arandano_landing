const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '../data/Inventario_Cafeteria_Bar_03_01_26.xlsx');
const workbook = XLSX.readFile(excelPath);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== HOJA: ${sheetName} ===`);
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  
  if (data.length > 0) {
    console.log('Columnas encontradas:', Object.keys(data[0]));
    console.log('\nPrimeras 3 filas:');
    data.slice(0, 3).forEach((row, i) => {
      console.log(`\nFila ${i + 1}:`, JSON.stringify(row, null, 2));
    });
  } else {
    console.log('Hoja vacía o sin datos');
  }
});

