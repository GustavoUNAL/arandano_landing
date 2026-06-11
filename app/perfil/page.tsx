'use client'

import PerfilDashboard from '@/components/sports/PerfilDashboard'
import UserAvatar from '@/components/sports/UserAvatar'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Suspense } from 'react'

export default function PerfilPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-berry-400/30 border-t-berry-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-4">
        <UserAvatar size={80} className="mb-6 border-berry-500/50" />
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Mi perfil</h1>
          <p className="text-stone-400 mb-6">Juega la polla mundialista con tus amigos</p>
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/perfil' })}
            className="w-full px-6 py-3 bg-berry-600 hover:bg-berry-500 text-white font-semibold rounded-xl transition-colors"
          >
            Jugar con Google
          </button>
          <Link href="/mundial" className="inline-block mt-4 text-sm text-berry-400 hover:text-berry-300">
            Volver a la polla
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-berry-400/30 border-t-berry-400 rounded-full animate-spin" />
        </div>
      }
    >
      <PerfilDashboard />
    </Suspense>
  )
}
