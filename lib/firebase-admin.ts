/**
 * Configuración de Firebase Admin para el servidor
 * Usar en API routes y server components
 */

import admin from 'firebase-admin'

if (!admin.apps.length) {
  try {
    let serviceAccount
    
    // Prioridad 1: Variable de entorno (más seguro para producción)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    } 
    // Prioridad 2: Archivo local (desarrollo)
    else {
      try {
        const path = require('path')
        const fs = require('fs')
        const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json')
        if (fs.existsSync(serviceAccountPath)) {
          serviceAccount = require(serviceAccountPath)
        } else {
          // Si no existe el archivo y estamos en producción, lanzar error
          if (process.env.NODE_ENV === 'production') {
            throw new Error('Firebase Service Account no encontrado. Configura FIREBASE_SERVICE_ACCOUNT o el archivo firebase-service-account.json')
          }
          // En desarrollo, solo mostrar warning
          console.warn('⚠️  Firebase Service Account no encontrado. Usa FIREBASE_SERVICE_ACCOUNT o crea firebase-service-account.json')
        }
      } catch (fileError: any) {
        // Si no existe el archivo y estamos en producción, lanzar error
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Firebase Service Account no encontrado: ' + fileError.message)
        }
        console.warn('⚠️  Firebase Service Account no encontrado:', fileError.message)
      }
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
  } catch (error: any) {
    console.error('Error inicializando Firebase Admin:', error.message)
    // No lanzar error en desarrollo si Firebase no está configurado
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}

export const db = admin.firestore()
export default admin

