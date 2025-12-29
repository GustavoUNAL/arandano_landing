import { NextRequest, NextResponse } from 'next/server'

// Contraseña simple - en producción deberías usar hash y variables de entorno
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'gusoni'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (password === ADMIN_PASSWORD) {
      // Crear una sesión simple (en producción usar JWT o sesiones seguras)
      const response = NextResponse.json({ success: true })
      response.cookies.set('admin-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 días
      })
      return response
    }
    
    return NextResponse.json(
      { error: 'Contraseña incorrecta' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Error en la autenticación' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const authCookie = request.cookies.get('admin-auth')
  
  if (authCookie?.value === 'authenticated') {
    return NextResponse.json({ authenticated: true })
  }
  
  return NextResponse.json({ authenticated: false })
}

