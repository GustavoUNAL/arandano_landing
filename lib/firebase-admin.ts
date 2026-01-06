/**
 * Configuración de Firebase Admin para el servidor
 * Usar en API routes y server components
 */

import admin from 'firebase-admin'

let firestoreDb: admin.firestore.Firestore | null = null

if (!admin.apps.length) {
  try {
    let serviceAccount
    
    // Prioridad 1: Variable de entorno (más seguro para producción)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      } catch (parseError) {
        console.error('Error parseando FIREBASE_SERVICE_ACCOUNT:', parseError)
        serviceAccount = null
      }
    } 
    // Prioridad 2: Archivo local (desarrollo)
    if (!serviceAccount) {
      try {
        const path = require('path')
        const fs = require('fs')
        const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json')
        if (fs.existsSync(serviceAccountPath)) {
          serviceAccount = require(serviceAccountPath)
        }
      } catch (fileError: any) {
        // Ignorar errores de archivo durante build
        if (process.env.NEXT_PHASE !== 'phase-production-build') {
          console.warn('⚠️  Firebase Service Account no encontrado:', fileError.message)
        }
      }
    }

    // Solo inicializar si tenemos serviceAccount
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
      firestoreDb = admin.firestore()
    } else {
      // Durante el build, no lanzar error si no hay configuración
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        console.warn('⚠️  Firebase no configurado durante build. Asegúrate de configurarlo antes de ejecutar la aplicación.')
      } else if (process.env.NODE_ENV === 'production') {
        throw new Error('Firebase Service Account no encontrado. Configura FIREBASE_SERVICE_ACCOUNT o el archivo firebase-service-account.json')
      } else {
        console.warn('⚠️  Firebase Service Account no encontrado. Usa FIREBASE_SERVICE_ACCOUNT o crea firebase-service-account.json')
      }
    }
  } catch (error: any) {
    // Durante el build, no lanzar error
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('⚠️  Error inicializando Firebase Admin durante build:', error.message)
    } else {
      console.error('Error inicializando Firebase Admin:', error.message)
      if (process.env.NODE_ENV === 'production') {
        throw error
      }
    }
  }
} else {
  // Si ya está inicializado, obtener db
  firestoreDb = admin.firestore()
}

// Exportar db con fallback seguro para build
export const db = firestoreDb || (admin.apps.length > 0 ? admin.firestore() : ({} as any))
export default admin

