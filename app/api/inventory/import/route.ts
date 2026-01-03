import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Ejecutar el script de importación
    const scriptPath = path.join(process.cwd(), 'scripts', 'import-inventory.js')
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`)
    
    if (stderr && !stderr.includes('warn')) {
      return NextResponse.json(
        { error: 'Error al importar inventario', details: stderr },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Inventario importado exitosamente',
      output: stdout 
    })
  } catch (error: any) {
    console.error('Error importing inventory:', error)
    return NextResponse.json(
      { error: 'Error al importar inventario', details: error.message },
      { status: 500 }
    )
  }
}

