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
        serviceAccount = require('../firebase-service-account.json')
      } catch (fileError) {
        // Si no existe el archivo, intentar desde la raíz del proyecto
        const path = require('path')
        const fs = require('fs')
        const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json')
        if (fs.existsSync(serviceAccountPath)) {
          serviceAccount = require(serviceAccountPath)
        } else {
          throw new Error('Firebase Service Account no encontrado')
        }
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

